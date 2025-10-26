import fp from 'fastify-plugin';
import { Prisma } from '@prisma/client';
import { Type, type Static } from '@sinclair/typebox';
import type { FastifyError, FastifyInstance } from 'fastify';

// --- Общая схема ошибок ---
export const ErrorSchema = Type.Object(
  {
    message: Type.String(),
    code: Type.Optional(Type.String()),
    details: Type.Optional(Type.Unknown()),
  },
  { $id: 'ApiError', additionalProperties: false },
);

export type ApiError = Static<typeof ErrorSchema>;

export const errorResponses = {
  400: { $ref: 'ApiError#' },
  401: { $ref: 'ApiError#' },
  403: { $ref: 'ApiError#' },
  404: { $ref: 'ApiError#' },
  409: { $ref: 'ApiError#' },
  500: { $ref: 'ApiError#' },
} as const;

export default fp(async function errorsPlugin(app: FastifyInstance) {
  app.addSchema(ErrorSchema);

  app.setErrorHandler((err: FastifyError & { validation?: unknown }, _req, reply) => {
    let status = typeof err.statusCode === 'number' ? err.statusCode : 500;

    // Проверяем, есть ли поле validation
    if ('validation' in err && err.validation) {
      status = 400;
    }

    let code: string | undefined;

    // Prisma ошибки
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      code = err.code;
      if (err.code === 'P2025') status = 404;
      if (err.code === 'P2002') status = 409;
    }

    const body: ApiError = {
      message: err.message || 'Internal Server Error',
      ...(code ? { code } : {}),
      details: process.env.NODE_ENV === 'development' ? err : undefined,
    };

    reply.status(status).send(body);
  });

  app.setNotFoundHandler((_req, reply) => {
    const body: ApiError = { message: 'Route not found' };
    reply.status(404).send(body);
  });
});
