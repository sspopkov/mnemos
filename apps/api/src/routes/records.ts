import type { FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { prisma } from '../prisma';
import {
  OperationResultSchema,
  RecordCreateSchema,
  RecordIdParamsSchema,
  RecordListSchema,
  RecordSchema,
  RecordUpdateSchema,
} from '../schemas/records';

export async function recordsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<TypeBoxTypeProvider>();

  server.get(
    '/api/records',
    {
      schema: {
        tags: ['Records'],
        summary: 'Получить список записей',
        response: {
          200: RecordListSchema,
        },
      },
    },
    async () => {
      return prisma.record.findMany({ orderBy: { createdAt: 'desc' } });
    },
  );

  server.post(
    '/api/records',
    {
      schema: {
        tags: ['Records'],
        summary: 'Создать новую запись',
        body: RecordCreateSchema,
        response: {
          201: RecordSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body;
      const record = await prisma.record.create({
        data: { title: body.title, content: body.content ?? null },
      });
      reply.code(201);
      return record;
    },
  );

  server.put(
    '/api/records/:id',
    {
      schema: {
        tags: ['Records'],
        summary: 'Обновить запись',
        params: RecordIdParamsSchema,
        body: RecordUpdateSchema,
        response: {
          200: RecordSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      const body = request.body;
      const record = await prisma.record.update({
        where: { id },
        data: { ...body },
      });
      return record;
    },
  );

  server.delete(
    '/api/records/:id',
    {
      schema: {
        tags: ['Records'],
        summary: 'Удалить запись',
        params: RecordIdParamsSchema,
        response: {
          200: OperationResultSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      await prisma.record.delete({ where: { id } });
      return { ok: true } as const;
    },
  );
}
