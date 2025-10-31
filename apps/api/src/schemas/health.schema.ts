import { Type, type Static } from '@sinclair/typebox';

export const HealthResponseSchema = Type.Object(
  {
    ok: Type.Boolean(),
    ts: Type.String({ format: 'date-time' }),
  },
  { $id: 'HealthResponse', title: 'HealthResponse', additionalProperties: false },
);

export const healthSchemas = [HealthResponseSchema] as const;

export type HealthResponse = Static<typeof HealthResponseSchema>;
