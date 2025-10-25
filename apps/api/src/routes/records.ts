import { Type } from '@sinclair/typebox';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { prisma } from '../prisma';

const RecordSchema = Type.Object(
  {
    id: Type.String(),
    title: Type.String(),
    content: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  },
  { $id: 'Record' },
);

const RecordParamsSchema = Type.Object({
  id: Type.String(),
});

const CreateRecordBodySchema = Type.Object(
  {
    title: Type.String({ minLength: 1 }),
    content: Type.Optional(Type.String()),
  },
  { $id: 'CreateRecordBody' },
);

const UpdateRecordBodySchema = Type.Partial(
  Type.Object({
    title: Type.String({ minLength: 1 }),
    content: Type.Union([Type.String(), Type.Null()]),
  }),
  { $id: 'UpdateRecordBody' },
);

const DeleteRecordResponseSchema = Type.Object(
  {
    ok: Type.Boolean(),
  },
  { $id: 'DeleteRecordResponse' },
);

const ErrorResponseSchema = Type.Object(
  {
    error: Type.String(),
  },
  { $id: 'ErrorResponse' },
);

export const recordsRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addSchema(RecordSchema);
  app.addSchema(ErrorResponseSchema);
  app.addSchema(CreateRecordBodySchema);
  app.addSchema(UpdateRecordBodySchema);
  app.addSchema(DeleteRecordResponseSchema);

  app.get(
    '/api/records',
    {
      schema: {
        tags: ['records'],
        response: {
          200: Type.Array(Type.Ref(RecordSchema)),
        },
      },
    },
    async () => {
      return prisma.record.findMany({ orderBy: { createdAt: 'desc' } });
    },
  );

  app.post(
    '/api/records',
    {
      schema: {
        tags: ['records'],
        body: Type.Ref(CreateRecordBodySchema),
        response: {
          201: Type.Ref(RecordSchema),
          400: Type.Ref(ErrorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const { title, content } = request.body;
      if (!title) {
        return reply.code(400).send({ error: 'title is required' });
      }

      const record = await prisma.record.create({
        data: { title, content: content ?? null },
      });

      reply.code(201);
      return record;
    },
  );

  app.put(
    '/api/records/:id',
    {
      schema: {
        tags: ['records'],
        params: RecordParamsSchema,
        body: Type.Ref(UpdateRecordBodySchema),
        response: {
          200: Type.Ref(RecordSchema),
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      const record = await prisma.record.update({
        where: { id },
        data: { ...request.body },
      });
      return record;
    },
  );

  app.delete(
    '/api/records/:id',
    {
      schema: {
        tags: ['records'],
        params: RecordParamsSchema,
        response: {
          200: DeleteRecordResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      await prisma.record.delete({ where: { id } });
      return { ok: true } as const;
    },
  );
};
