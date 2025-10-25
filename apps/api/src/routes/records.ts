import type { FastifyInstance } from 'fastify';
import { Type, type Static } from '@sinclair/typebox';
import type { Record as PrismaRecord } from '@prisma/client';

import { prisma } from '../prisma';

// --- Schemas ---
const RecordContent = Type.Union([Type.String(), Type.Null()]);

const RecordSchema = Type.Object(
  {
    id: Type.String({ format: 'uuid' }),
    title: Type.String(),
    content: RecordContent,
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  },
  { additionalProperties: false },
);

const RecordListSchema = Type.Array(RecordSchema);

const RecordParamsSchema = Type.Object(
  {
    id: Type.String({ format: 'uuid' }),
  },
  { additionalProperties: false },
);

const CreateRecordBodySchema = Type.Object(
  {
    title: Type.String({ minLength: 1 }),
    content: Type.Optional(RecordContent),
  },
  { additionalProperties: false },
);

const UpdateRecordBodySchema = Type.Partial(
  Type.Object(
    {
      title: Type.String({ minLength: 1 }),
      content: RecordContent,
    },
    { additionalProperties: false },
  ),
);

const DeleteRecordResponseSchema = Type.Object(
  {
    ok: Type.Literal(true),
  },
  { additionalProperties: false },
);

// --- Types ---
type RecordEntity = Static<typeof RecordSchema>;
type RecordParams = Static<typeof RecordParamsSchema>;
type CreateRecordBody = Static<typeof CreateRecordBodySchema>;
type UpdateRecordBody = Static<typeof UpdateRecordBodySchema>;
type DeleteRecordResponse = Static<typeof DeleteRecordResponseSchema>;

// Универсальный маппер: Prisma Date -> ISO string
const toRecordEntity = (r: PrismaRecord): RecordEntity => ({
  id: r.id,
  title: r.title,
  content: r.content,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

export async function recordsRoutes(app: FastifyInstance) {
  // GET /api/records
  app.get<{ Reply: RecordEntity[] }>(
    '/api/records',
    {
      schema: {
        tags: ['records'],
        summary: 'List records',
        operationId: 'getRecords',
        response: {
          200: RecordListSchema,
        },
      },
    },
    async () => {
      const rows = await prisma.record.findMany({ orderBy: { createdAt: 'desc' } });
      return rows.map(toRecordEntity);
    },
  );

  // POST /api/records
  app.post<{ Body: CreateRecordBody; Reply: RecordEntity }>(
    '/api/records',
    {
      schema: {
        tags: ['records'],
        summary: 'Create record',
        operationId: 'createRecord',
        body: CreateRecordBodySchema,
        response: {
          201: RecordSchema,
        },
      },
    },
    async (req, reply) => {
      const rec = await prisma.record.create({
        data: { title: req.body.title, content: req.body.content ?? null },
      });
      return reply.code(201).send(toRecordEntity(rec));
    },
  );

  // PUT /api/records/:id
  app.put<{ Params: RecordParams; Body: UpdateRecordBody; Reply: RecordEntity }>(
    '/api/records/:id',
    {
      schema: {
        tags: ['records'],
        summary: 'Update record',
        operationId: 'updateRecord',
        params: RecordParamsSchema,
        body: UpdateRecordBodySchema,
        response: {
          200: RecordSchema,
        },
      },
    },
    async (req) => {
      const rec = await prisma.record.update({
        where: { id: req.params.id },
        data: {
          ...(req.body.title !== undefined ? { title: req.body.title } : {}),
          ...(req.body.content !== undefined ? { content: req.body.content } : {}),
        },
      });
      return toRecordEntity(rec);
    },
  );

  // DELETE /api/records/:id
  app.delete<{ Params: RecordParams; Reply: DeleteRecordResponse }>(
    '/api/records/:id',
    {
      schema: {
        tags: ['records'],
        summary: 'Delete record',
        operationId: 'deleteRecord',
        params: RecordParamsSchema,
        response: {
          200: DeleteRecordResponseSchema,
        },
      },
    },
    async (req) => {
      await prisma.record.delete({ where: { id: req.params.id } });
      return { ok: true as const };
    },
  );
}
