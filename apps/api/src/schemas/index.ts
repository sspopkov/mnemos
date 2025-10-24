export const HealthResponseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ok: { const: true },
    ts: { type: 'string', format: 'date-time' },
  },
  required: ['ok', 'ts'],
  description: 'Health check response',
} as const;

export const RecordSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    content: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'title', 'content', 'createdAt', 'updatedAt'],
  description: 'Record entity',
} as const;

export const RecordListSchema = {
  type: 'array',
  items: RecordSchema,
  description: 'List of records ordered by creation date',
} as const;

export const CreateRecordBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 1 },
    content: { type: 'string' },
  },
  required: ['title'],
  description: 'Payload for creating a record',
} as const;

export const UpdateRecordBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 1 },
    content: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
  description: 'Payload for updating a record',
} as const;

export const RecordIdParamsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', minLength: 1 },
  },
  required: ['id'],
  description: 'Record identifier parameter',
} as const;

export const DeleteRecordResponseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ok: { const: true },
  },
  required: ['ok'],
  description: 'Confirmation that a record was deleted',
} as const;

export const ErrorResponseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    error: { type: 'string' },
  },
  required: ['error'],
  description: 'Error response with message',
} as const;
