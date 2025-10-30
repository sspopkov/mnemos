import type { FastifyInstance } from 'fastify';
import { Type, type Static } from '@sinclair/typebox';
import type { Record as PrismaRecord } from '@prisma/client';

import { prisma } from '../prisma';
import { errorResponses } from '../plugins/errors';

// --- Schemas ---
const RecordContentSchema = Type.Union([Type.String(), Type.Null()], {
  $id: 'RecordContent',
  title: 'RecordContent',
});

const RecordSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    title: Type.String(),
    content: Type.Ref(RecordContentSchema),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  },
  { $id: 'Record', title: 'Record', additionalProperties: false },
);

const RecordListSchema = Type.Array(Type.Ref(RecordSchema), {
  $id: 'RecordList',
  title: 'RecordList',
});

const RecordParamsSchema = Type.Object(
  { id: Type.String({ minLength: 1 }) },
  { $id: 'RecordParams', title: 'RecordParams', additionalProperties: false },
);

const CreateRecordBodySchema = Type.Object(
  {
    title: Type.String({ minLength: 1 }),
    content: Type.Optional(Type.Ref(RecordContentSchema)),
  },
  { $id: 'CreateRecordRequest', title: 'CreateRecordRequest', additionalProperties: false },
);

const UpdateRecordBodySchema = Type.Partial(
  Type.Object(
    {
      title: Type.String({ minLength: 1 }),
      content: Type.Ref(RecordContentSchema),
    },
    { additionalProperties: false },
  ),
  { $id: 'UpdateRecordRequest', title: 'UpdateRecordRequest', additionalProperties: false },
);

const DeleteRecordResponseSchema = Type.Object(
  { ok: Type.Literal(true) },
  { $id: 'DeleteRecordResponse', title: 'DeleteRecordResponse', additionalProperties: false },
);

// --- Types ---
type RecordEntity = Static<typeof RecordSchema>;
type RecordParams = Static<typeof RecordParamsSchema>;
type CreateRecordBody = Static<typeof CreateRecordBodySchema>;
type UpdateRecordBody = Static<typeof UpdateRecordBodySchema>;
type DeleteRecordResponse = Static<typeof DeleteRecordResponseSchema>;

// Prisma Date -> ISO string
const toRecordEntity = (r: PrismaRecord): RecordEntity => ({
  id: r.id,
  title: r.title,
  content: r.content,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

export async function recordsRoutes(app: FastifyInstance) {
  app.addSchema(RecordContentSchema);
  app.addSchema(RecordSchema);
  app.addSchema(RecordListSchema);
  app.addSchema(RecordParamsSchema);
  app.addSchema(CreateRecordBodySchema);
  app.addSchema(UpdateRecordBodySchema);
  app.addSchema(DeleteRecordResponseSchema);

  // GET /api/records
  app.get<{ Reply: RecordEntity[] }>(
    '/api/records',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['records'],
        summary: 'List records',
        operationId: 'getRecords',
        response: {
          200: Type.Ref(RecordListSchema),
          ...errorResponses, // 400/401/403/404/409/500 -> { $ref: 'ApiError#' }
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (req) => {
      const rows = await prisma.record.findMany({
        where: { userId: req.user.sub },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map(toRecordEntity);
    },
  );

  // POST /api/records
  app.post<{ Body: CreateRecordBody; Reply: RecordEntity }>(
    '/api/records',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['records'],
        summary: 'Create record',
        operationId: 'createRecord',
        body: Type.Ref(CreateRecordBodySchema),
        response: {
          201: Type.Ref(RecordSchema),
          ...errorResponses,
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const rec = await prisma.record.create({
        data: {
          title: req.body.title,
          content: req.body.content ?? null,
          userId: req.user.sub,
        },
      });
      return reply.code(201).send(toRecordEntity(rec));
    },
  );

  // PUT /api/records/:id
  app.put<{ Params: RecordParams; Body: UpdateRecordBody; Reply: RecordEntity }>(
    '/api/records/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['records'],
        summary: 'Update record',
        operationId: 'updateRecord',
        params: Type.Ref(RecordParamsSchema),
        body: Type.Ref(UpdateRecordBodySchema),
        response: {
          200: Type.Ref(RecordSchema),
          ...errorResponses,
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (req) => {
      const existing = await prisma.record.findFirst({
        where: { id: req.params.id, userId: req.user.sub },
      });

      if (!existing) {
        throw app.httpErrors.notFound('Record not found');
      }

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
      onRequest: [app.authenticate],
      schema: {
        tags: ['records'],
        summary: 'Delete record',
        operationId: 'deleteRecord',
        params: Type.Ref(RecordParamsSchema),
        response: {
          200: Type.Ref(DeleteRecordResponseSchema),
          ...errorResponses,
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (req) => {
      const result = await prisma.record.deleteMany({
        where: { id: req.params.id, userId: req.user.sub },
      });

      if (result.count === 0) {
        throw app.httpErrors.notFound('Record not found');
      }

      return { ok: true as const };
    },
  );
}
