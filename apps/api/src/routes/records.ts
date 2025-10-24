import type { FastifyInstance } from 'fastify';

import { prisma } from '../prisma';
import {
  CreateRecordBodySchema,
  DeleteRecordResponseSchema,
  ErrorResponseSchema,
  RecordIdParamsSchema,
  RecordListSchema,
  RecordSchema,
  UpdateRecordBodySchema,
} from '../schemas';

export type RecordEntity = {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateRecordBody = {
  title: string;
  content?: string;
};

export type UpdateRecordBody = {
  title?: string;
  content?: string | null;
};

export type RecordIdParams = {
  id: string;
};

export async function recordsRoutes(app: FastifyInstance) {
  app.get(
    '/api/records',
    {
      schema: {
        tags: ['Records'],
        summary: 'List all records',
        response: {
          200: RecordListSchema,
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
        tags: ['Records'],
        summary: 'Create a new record',
        body: CreateRecordBodySchema,
        response: {
          201: RecordSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { title, content } = request.body as CreateRecordBody;
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        return reply.code(400).send({ error: 'title is required' });
      }

      const record = await prisma.record.create({
        data: { title: trimmedTitle, content: content ?? null },
      });
      return reply.code(201).send(record satisfies RecordEntity);
    },
  );

  app.put(
    '/api/records/:id',
    {
      schema: {
        tags: ['Records'],
        summary: 'Update an existing record',
        params: RecordIdParamsSchema,
        body: UpdateRecordBodySchema,
        response: {
          200: RecordSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params as RecordIdParams;
      const body = request.body as UpdateRecordBody;
      return prisma.record.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.content !== undefined ? { content: body.content } : {}),
        },
      });
    },
  );

  app.delete(
    '/api/records/:id',
    {
      schema: {
        tags: ['Records'],
        summary: 'Delete a record',
        params: RecordIdParamsSchema,
        response: {
          200: DeleteRecordResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params as RecordIdParams;
      await prisma.record.delete({ where: { id } });
      return { ok: true } as const;
    },
  );
}

