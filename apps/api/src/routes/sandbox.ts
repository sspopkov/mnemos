import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';

import { errorResponses } from '../plugins/errors';

const SandboxResponseSchema = Type.Object(
  {
    message: Type.String(),
  },
  { $id: 'SandboxResponse', title: 'SandboxResponse', additionalProperties: false },
);

export async function sandboxRoutes(app: FastifyInstance) {
  app.addSchema(SandboxResponseSchema);

  if (process.env.NODE_ENV === 'production') {
    app.log.info('Sandbox routes are disabled in production mode');
    return;
  }

  app.get(
    '/api/sandbox/success',
    {
      schema: {
        tags: ['sandbox'],
        summary: 'Trigger sandbox success notification',
        response: {
          200: Type.Ref(SandboxResponseSchema),
          ...errorResponses,
        },
      },
    },
    async () => ({ message: 'Запрос выполнен успешно' }),
  );

  app.get(
    '/api/sandbox/failure',
    {
      schema: {
        tags: ['sandbox'],
        summary: 'Trigger sandbox failure notification',
        response: {
          ...errorResponses,
        },
      },
    },
    async () => {
      throw app.httpErrors.internalServerError('Серверная ошибка для проверки уведомлений');
    },
  );
}
