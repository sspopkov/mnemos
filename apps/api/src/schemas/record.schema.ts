import { Type, type Static } from '@sinclair/typebox';

export const RecordContentSchema = Type.Union([Type.String(), Type.Null()], {
  $id: 'RecordContent',
});

export const RecordSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    title: Type.String(),
    content: Type.Ref(RecordContentSchema),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  },
  { $id: 'Record', additionalProperties: false },
);

export const RecordListSchema = Type.Array(Type.Ref(RecordSchema), { $id: 'RecordList' });

export const RecordParamsSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
  },
  { $id: 'RecordParams', additionalProperties: false },
);

export const CreateRecordBodySchema = Type.Object(
  {
    title: Type.String({ minLength: 1 }),
    content: Type.Optional(Type.Ref(RecordContentSchema)),
  },
  { $id: 'CreateRecordRequest', additionalProperties: false },
);

export const UpdateRecordBodySchema = Type.Partial(
  Type.Object(
    {
      title: Type.String({ minLength: 1 }),
      content: Type.Ref(RecordContentSchema),
    },
    { additionalProperties: false },
  ),
  {
    $id: 'UpdateRecordRequest',
    additionalProperties: false,
  },
);

export const DeleteRecordResponseSchema = Type.Object(
  {
    ok: Type.Literal(true),
  },
  { $id: 'DeleteRecordResponse', additionalProperties: false },
);

export type RecordEntity = Static<typeof RecordSchema>;
export type RecordParams = Static<typeof RecordParamsSchema>;
export type CreateRecordBody = Static<typeof CreateRecordBodySchema>;
export type UpdateRecordBody = Static<typeof UpdateRecordBodySchema>;
export type DeleteRecordResponse = Static<typeof DeleteRecordResponseSchema>;
