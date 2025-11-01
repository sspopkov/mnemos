import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';

import { errorResponses } from '../plugins/errors';
import {
  SandboxResponseSchema,
  SandboxDelayQuerySchema,
  sandboxSchemas,
  type SandboxResponse,
  type SandboxDelayQuery,
} from '../schemas/sandbox.schema';
import {
  triggerSandboxFailure,
  triggerSandboxSuccess,
  triggerSandboxDelayed,
} from '../controllers/sandbox.controller';

export async function sandboxRoutes(app: FastifyInstance) {
  sandboxSchemas.forEach((schema) => app.addSchema(schema));

  if (process.env.NODE_ENV === 'production') {
    app.log.info('Sandbox routes are disabled in production mode');
    return;
  }

  app.get<{ Reply: SandboxResponse }>(
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
    async () => triggerSandboxSuccess(),
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
    async () => triggerSandboxFailure(app),
  );

  app.get<{ Reply: SandboxResponse; Querystring: SandboxDelayQuery }>(
    '/api/sandbox/delayed',
    {
      schema: {
        tags: ['sandbox'],
        summary: 'Trigger sandbox delayed notification',
        querystring: Type.Ref(SandboxDelayQuerySchema),
        response: {
          200: Type.Ref(SandboxResponseSchema),
          ...errorResponses,
        },
      },
    },
    async (request) => triggerSandboxDelayed(request.query.delayMs),
  );
}
