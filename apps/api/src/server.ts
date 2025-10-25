import Fastify from 'fastify';
import type { FastifyServerOptions } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { recordsRoutes } from './routes/records';
import { HealthResponseSchema } from './schemas/health';

type CreateServerOptions = Pick<FastifyServerOptions, 'logger'>;

export function createServer(options: CreateServerOptions = {}) {
  const server = Fastify({ logger: options.logger ?? true }).withTypeProvider<TypeBoxTypeProvider>();

  server.register(fastifyCors, { origin: true });

  server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Mnemos API',
        version: '1.0.0',
        description: 'HTTP API для сервиса Mnemos',
      },
      servers: [
        {
          url: '/',
          description: 'Текущий сервер',
        },
      ],
      tags: [
        { name: 'Health', description: 'Мониторинг состояния сервиса' },
        { name: 'Records', description: 'Управление записями' },
      ],
    },
  });

  server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
  });

  server.get(
    '/api/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Получить состояние сервиса',
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    async () => ({
      ok: true,
      ts: new Date().toISOString(),
    }),
  );

  server.register(recordsRoutes);

  return server;
}
