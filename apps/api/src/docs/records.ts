export const recordsOpenApiPaths = {
  '/api/records': {
    get: {
      tags: ['Records'],
      summary: 'List all records',
      operationId: 'listRecords',
      responses: {
        200: {
          description: 'Records retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecordDtoList' },
            },
          },
        },
      },
    },
    post: {
      tags: ['Records'],
      summary: 'Create a new record',
      operationId: 'createRecord',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RecordCreateInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Record created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecordDto' },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/records/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', minLength: 1 },
        description: 'Record identifier',
      },
    ],
    put: {
      tags: ['Records'],
      summary: 'Update an existing record',
      operationId: 'updateRecord',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RecordUpdateInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Record updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecordDto' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Records'],
      summary: 'Delete a record',
      operationId: 'deleteRecord',
      responses: {
        200: {
          description: 'Record deleted successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecordDeleteResponse' },
            },
          },
        },
      },
    },
  },
} as const;
