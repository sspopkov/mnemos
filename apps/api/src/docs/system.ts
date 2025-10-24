export const systemOpenApiPaths = {
  '/api/health': {
    get: {
      tags: ['System'],
      summary: 'Health check',
      operationId: 'getHealth',
      responses: {
        200: {
          description: 'API is healthy',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HealthResponse' },
            },
          },
        },
      },
    },
  },
} as const;
