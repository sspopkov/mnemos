import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { env } from './env';
import { recordsRoutes } from './routes/records';

const server = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

const HealthResponseSchema = Type.Object(
  {
    ok: Type.Literal(true),
    ts: Type.String({ format: 'date-time' }),
  },
  { additionalProperties: false },
);

async function bootstrap() {
  await server.register(fastifyCors, { origin: true });

  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Mnemos API',
        version: '1.0.0',
      },
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  server.get(
    '/api/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Health check',
        operationId: 'getHealth',
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

  await server.register(recordsRoutes);

  await server.listen({ port: env.port, host: env.host });
  server.log.info(`API listening on http://${env.host}:${env.port}`);
}

bootstrap().catch((error) => {
  server.log.error(error, 'Failed to start API server');
  process.exit(1);
});
