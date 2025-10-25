import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

export const HealthResponseSchema = Type.Object({
  ok: Type.Literal(true),
  ts: Type.String({ format: 'date-time' }),
});

export type HealthResponse = Static<typeof HealthResponseSchema>;
