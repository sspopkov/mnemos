import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';

import { env } from './env';
import { recordsRoutes } from './routes/records';
import { systemRoutes } from './routes/system';

export async function buildServer() {
  const server = Fastify({ logger: true });

  await server.register(fastifyCors, { origin: true, credentials: true });

  await server.register(systemRoutes);
  await server.register(recordsRoutes);

  return server;
}

export async function startServer() {
  const server = await buildServer();
  await server.listen({ port: env.port, host: env.host });
  server.log.info(`API listening on http://${env.host}:${env.port}`);
  return server;
}
