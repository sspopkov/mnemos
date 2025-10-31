import type { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  RecordListSchema,
  RecordSchema,
  RecordParamsSchema,
  CreateRecordBodySchema,
  UpdateRecordBodySchema,
  DeleteRecordResponseSchema,
  recordSchemas,
  type RecordEntity,
  type RecordParams,
  type CreateRecordBody,
  type UpdateRecordBody,
  type DeleteRecordResponse,
} from '../schemas/record.schema';
import { errorResponses } from '../plugins/errors';
import {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
} from '../controllers/records.controller';

export async function recordsRoutes(app: FastifyInstance) {
  recordSchemas.forEach((schema) => app.addSchema(schema));

  // GET /api/records
  app.get<{ Reply: RecordEntity[] }>(
    '/api/records',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['records'],
        summary: 'List records',
        operationId: 'getRecords',
        response: { 200: Type.Ref(RecordListSchema), ...errorResponses },
        security: [{ bearerAuth: [] }],
      },
    },
    async (req) => listRecords(req.user.sub),
  );

  // POST /api/records
  app.post<{ Body: CreateRecordBody; Reply: RecordEntity }>(
    '/api/records',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['records'],
        summary: 'Create record',
        operationId: 'createRecord',
        body: Type.Ref(CreateRecordBodySchema),
        response: { 201: Type.Ref(RecordSchema), ...errorResponses },
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => reply.code(201).send(await createRecord(req.user.sub, req.body)),
  );

  // PUT /api/records/:id
  app.put<{ Params: RecordParams; Body: UpdateRecordBody; Reply: RecordEntity }>(
    '/api/records/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['records'],
        summary: 'Update record',
        operationId: 'updateRecord',
        params: Type.Ref(RecordParamsSchema),
        body: Type.Ref(UpdateRecordBodySchema),
        response: { 200: Type.Ref(RecordSchema), ...errorResponses },
        security: [{ bearerAuth: [] }],
      },
    },
    async (req) => {
      const updated = await updateRecord(req.user.sub, req.params.id, req.body);
      if (!updated) throw app.httpErrors.notFound('Record not found');
      return updated;
    },
  );

  // DELETE /api/records/:id
  app.delete<{ Params: RecordParams; Reply: DeleteRecordResponse }>(
    '/api/records/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['records'],
        summary: 'Delete record',
        operationId: 'deleteRecord',
        params: Type.Ref(RecordParamsSchema),
        response: { 200: Type.Ref(DeleteRecordResponseSchema), ...errorResponses },
        security: [{ bearerAuth: [] }],
      },
    },
    async (req) => {
      const ok = await deleteRecord(req.user.sub, req.params.id);
      if (!ok) throw app.httpErrors.notFound('Record not found');
      return { ok: true as const };
    },
  );
}
