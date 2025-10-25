import { env } from './env';
import { buildServer } from './server';

async function bootstrap() {
  const server = await buildServer();

  await server.listen({ port: env.port, host: env.host });
  server.log.info(`API listening on http://${env.host}:${env.port}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
