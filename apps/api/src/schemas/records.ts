import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

export const RecordIdParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const RecordSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  title: Type.String(),
  content: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export const RecordListSchema = Type.Array(RecordSchema);

export const RecordCreateSchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.Optional(Type.String()),
});

export const RecordUpdateSchema = Type.Partial(
  Type.Object({
    title: Type.String({ minLength: 1 }),
    content: Type.Union([Type.String(), Type.Null()]),
  }),
);

export const OperationResultSchema = Type.Object({
  ok: Type.Literal(true),
});

export type RecordItem = Static<typeof RecordSchema>;
export type RecordList = Static<typeof RecordListSchema>;
export type RecordCreateInput = Static<typeof RecordCreateSchema>;
export type RecordUpdateInput = Static<typeof RecordUpdateSchema>;
export type OperationResult = Static<typeof OperationResultSchema>;
