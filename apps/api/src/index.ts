import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifySensible from '@fastify/sensible';
import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { env } from './env';
import { recordsRoutes } from './routes/records';
import errorsPlugin, { errorResponses } from './plugins/errors';
import authPlugin from './plugins/auth';
import { authRoutes } from './routes/auth';
import { sandboxRoutes } from './routes/sandbox';

const server = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

const HealthResponseSchema = Type.Object(
  {
    ok: Type.Boolean(),
    ts: Type.String({ format: 'date-time' }),
  },
  { $id: 'HealthResponse', title: 'HealthResponse', additionalProperties: false },
);

server.addSchema(HealthResponseSchema);

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
      buildLocalReference(json, _baseUri, _fragment, i) {
        const id = typeof json.$id === 'string' ? json.$id : undefined;
        const title = typeof json.title === 'string' ? json.title : undefined;
        return id ?? title ?? `Schema${i}`;
      },
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  // ⬇️ Регистрируем глобальный обработчик ошибок — обязательно ДО роутов
  await server.register(fastifySensible);

  await server.register(errorsPlugin);
  await server.register(authPlugin);

  server.get(
    '/api/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Health check',
        operationId: 'getHealth',
        response: {
          200: Type.Ref(HealthResponseSchema),
          ...errorResponses, // 400/401/403/404/409/500 -> { $ref: 'ApiError#' }
        },
      },
    },
    async () => ({ ok: true, ts: new Date().toISOString() }),
  );

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
