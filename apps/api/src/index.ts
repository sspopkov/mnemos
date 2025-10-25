import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { HealthResponse } from '@mnemos/types';

import { env } from './env';
import { recordsRoutes } from './routes/records';

const server = Fastify({ logger: true });

async function bootstrap() {
  await server.register(fastifyCors, { origin: true });
  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Mnemos API',
        description: 'Mnemos service API specification.',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${env.host}:${env.port}`,
        },
      ],
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
    async (): Promise<HealthResponse> => ({
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
