import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import type { HealthResponse } from '@mnemos/types';

import { env } from './env';
import { recordsRoutes } from './routes/records';

const server = Fastify({ logger: true });

async function bootstrap() {
  await server.register(fastifyCors, { origin: true });

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
