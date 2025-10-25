import type { FastifyInstance, FastifySchema } from 'fastify';
import type { Record } from '@prisma/client';

import { prisma } from '../prisma';

const recordSchema = {
  $id: 'Record',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'title', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string', description: 'Record identifier' },
    title: { type: 'string', description: 'Short title' },
    content: { type: ['string', 'null'], description: 'Optional content' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const satisfies FastifySchema;

const errorResponseSchema = {
  $id: 'ErrorResponse',
  type: 'object',
  additionalProperties: false,
  required: ['error'],
  properties: {
    error: { type: 'string' },
  },
} as const satisfies FastifySchema;

const createRecordBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title'],
  properties: {
    title: { type: 'string', minLength: 1 },
    content: { type: ['string', 'null'] },
  },
} as const;

const updateRecordBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 1 },
    content: { type: ['string', 'null'] },
  },
} as const;

const recordIdParamsSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', description: 'Record identifier' },
  },
} as const;

export async function recordsRoutes(app: FastifyInstance) {
  app.addSchema(recordSchema);
  app.addSchema(errorResponseSchema);

  app.get('/api/records', {
    schema: {
      tags: ['Records'],
      summary: 'List records',
      response: {
        200: {
          type: 'array',
          items: { $ref: 'Record#' },
        },
      },
    },
    async handler(): Promise<Record[]> {
      return prisma.record.findMany({ orderBy: { createdAt: 'desc' } });
    },
  });

  app.post('/api/records', {
    schema: {
      tags: ['Records'],
      summary: 'Create record',
      body: createRecordBodySchema,
      response: {
        201: { $ref: 'Record#' },
        400: { $ref: 'ErrorResponse#' },
      },
    },
    async handler(request, reply): Promise<Record | { error: string }> {
      const body = request.body as { title: string; content?: string | null };
      if (!body?.title) {
        reply.status(400);
        return { error: 'title is required' };
      }
      const record = await prisma.record.create({
        data: { title: body.title, content: body.content ?? null },
      });
      reply.status(201);
      return record;
    },
  });

  app.put('/api/records/:id', {
    schema: {
      tags: ['Records'],
      summary: 'Update record',
      params: recordIdParamsSchema,
      body: updateRecordBodySchema,
      response: {
        200: { $ref: 'Record#' },
      },
    },
    async handler(request): Promise<Record> {
      const { id } = request.params as { id: string };
      const body = request.body as { title?: string; content?: string | null };
      return prisma.record.update({ where: { id }, data: { ...body } });
    },
  });

  app.delete('/api/records/:id', {
    schema: {
      tags: ['Records'],
      summary: 'Delete record',
      params: recordIdParamsSchema,
      response: {
        200: {
          type: 'object',
          required: ['ok'],
          additionalProperties: false,
          properties: {
            ok: { type: 'boolean', const: true },
          },
        },
      },
    },
    async handler(request): Promise<{ ok: true }> {
      const { id } = request.params as { id: string };
      await prisma.record.delete({ where: { id } });
      return { ok: true };
    },
  });
}
