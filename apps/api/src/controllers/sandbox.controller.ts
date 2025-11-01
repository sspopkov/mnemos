import type { FastifyInstance } from 'fastify';

import type { SandboxResponse } from '../schemas/sandbox.schema';

export const triggerSandboxSuccess = async (): Promise<SandboxResponse> => ({
  message: 'Запрос выполнен успешно',
});

export const triggerSandboxFailure = async (app: FastifyInstance): Promise<never> => {
  throw app.httpErrors.internalServerError('Серверная ошибка для проверки уведомлений');
};

export const triggerSandboxDelayed = async (delayMs = 5000): Promise<SandboxResponse> => {
  const safeDelay = Number.isFinite(delayMs) ? Math.trunc(delayMs) : 0;
  const clampedDelay = Math.min(Math.max(safeDelay, 0), 60000);

  if (clampedDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, clampedDelay));
  }

  const seconds = clampedDelay / 1000;
  const formattedSeconds = Number.isInteger(seconds) ? seconds.toFixed(0) : seconds.toFixed(1);

  return {
    message:
      clampedDelay > 0
        ? `Долгий запрос завершён через ${formattedSeconds} с`
        : 'Долгий запрос завершён без задержки',
  };
};
