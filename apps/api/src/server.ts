import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { env } from './env';
import { recordsRoutes } from './routes/records';

const HealthResponseSchema = Type.Object({
  ok: Type.Literal(true),
  ts: Type.String({ format: 'date-time' }),
});

export async function buildServer() {
  const server = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

  await server.register(fastifyCors, { origin: true });

  server.addSchema(HealthResponseSchema);

  const publicHost = env.host === '0.0.0.0' ? 'localhost' : env.host;

  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Mnemos API',
        description: 'HTTP API for the Mnemos application.',
        version: '0.0.1',
      },
      servers: [
        {
          url: `http://${publicHost}:${env.port}`,
        },
      ],
    },
  });

  await server.register(swaggerUI, {
    routePrefix: '/docs',
  });

  server.get(
    '/api/health',
    {
      schema: {
        tags: ['health'],
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

  return server;
}
