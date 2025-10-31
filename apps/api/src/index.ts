import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifySensible from '@fastify/sensible';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { env } from './env';
import errorsPlugin from './plugins/errors';
import authPlugin from './plugins/auth';
import { authRoutes } from './routes/auth.routes';
import { sandboxRoutes } from './routes/sandbox.routes';
import { recordsRoutes } from './routes/records.routes';
import { healthRoutes } from './routes/health.routes';

const server = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

async function bootstrap() {
  await server.register(fastifyCors, {
    origin: env.corsOrigin ?? true,
    credentials: true,
  });

  await server.register(fastifySwagger, {
    openapi: {
      info: { title: 'Mnemos API', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    refResolver: {
      buildLocalReference(json, _base, _frag, i) {
        const id = typeof json.$id === 'string' ? json.$id : undefined;
        return id ?? `Schema${i}`;
      },
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  await server.register(fastifySensible);
  await server.register(errorsPlugin);
  await server.register(authPlugin);
  await server.register(healthRoutes);
  await server.register(authRoutes);
  await server.register(recordsRoutes);
  await server.register(sandboxRoutes);

  await server.listen({ port: env.port, host: env.host });
  server.log.info(`API listening on http://${env.host}:${env.port}`);
}

bootstrap().catch((error) => {
  server.log.error(error, 'Failed to start API server');
  process.exit(1);
});
