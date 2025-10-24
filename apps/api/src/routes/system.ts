import type { FastifyInstance } from 'fastify';

import { HealthResponseSchema } from '../schemas';

export async function systemRoutes(app: FastifyInstance) {
  app.get(
    '/api/health',
    {
      schema: {
        tags: ['System'],
        summary: 'Health check',
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    async () => ({ ok: true, ts: new Date().toISOString() }),
  );
}
