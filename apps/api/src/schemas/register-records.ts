import type { FastifyInstance } from 'fastify';
import {
  RecordContentSchema,
  RecordSchema,
  RecordListSchema,
  RecordParamsSchema,
  CreateRecordBodySchema,
  UpdateRecordBodySchema,
  DeleteRecordResponseSchema,
} from './record.schema';

export async function registerRecordSchemas(app: FastifyInstance) {
  app.addSchema(RecordContentSchema);
  app.addSchema(RecordSchema);
  app.addSchema(RecordListSchema);
  app.addSchema(RecordParamsSchema);
  app.addSchema(CreateRecordBodySchema);
  app.addSchema(UpdateRecordBodySchema);
  app.addSchema(DeleteRecordResponseSchema);
}
