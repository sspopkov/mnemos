import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';

import { errorResponses } from '../plugins/errors';
import {
  HealthResponseSchema,
  healthSchemas,
  type HealthResponse,
} from '../schemas/health.schema';
import { getHealthStatus } from '../controllers/health.controller';

export async function healthRoutes(app: FastifyInstance) {
  healthSchemas.forEach((schema) => app.addSchema(schema));

  app.get<{ Reply: HealthResponse }>(
    '/api/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Health check',
        operationId: 'getHealth',
        response: { 200: Type.Ref(HealthResponseSchema), ...errorResponses },
      },
    },
    async () => getHealthStatus(),
  );
}
