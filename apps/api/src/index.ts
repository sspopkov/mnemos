import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { env } from './env';
import { recordsRoutes } from './routes/records';
import errorsPlugin, { errorResponses } from './plugins/errors';

const server = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

const HealthResponseSchema = Type.Object(
  {
    ok: Type.Boolean(),
    ts: Type.String({ format: 'date-time' }),
  },
  { additionalProperties: false },
);

async function bootstrap() {
  await server.register(fastifyCors, { origin: true });

  await server.register(fastifySwagger, {
    openapi: {
      info: { title: 'Mnemos API', version: '1.0.0' },
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  // ⬇️ Регистрируем глобальный обработчик ошибок — обязательно ДО роутов
  await server.register(errorsPlugin);

  server.get(
    '/api/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Health check',
        operationId: 'getHealth',
        response: {
          200: HealthResponseSchema,
          ...errorResponses, // 400/401/403/404/409/500 -> { $ref: 'ApiError#' }
        },
      },
    },
    async () => ({ ok: true, ts: new Date().toISOString() }),
  );

  await server.register(recordsRoutes);

  await server.listen({ port: env.port, host: env.host });
  server.log.info(`API listening on http://${env.host}:${env.port}`);
}

bootstrap().catch((error) => {
  server.log.error(error, 'Failed to start API server');
  process.exit(1);
});
