import type { FastifyInstance } from 'fastify';

import type { SandboxResponse } from '../schemas/sandbox.schema';

export const triggerSandboxSuccess = async (): Promise<SandboxResponse> => ({
  message: 'Запрос выполнен успешно',
});

export const triggerSandboxFailure = async (app: FastifyInstance): Promise<never> => {
  throw app.httpErrors.internalServerError('Серверная ошибка для проверки уведомлений');
};
