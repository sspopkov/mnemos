import {
  CreateRecordBodySchema,
  DeleteRecordResponseSchema,
  ErrorResponseSchema,
  HealthResponseSchema,
  RecordListSchema,
  RecordSchema,
  UpdateRecordBodySchema,
} from './schemas';
import { recordsOpenApiPaths } from './docs/records';
import { systemOpenApiPaths } from './docs/system';

function mergePaths(...pathGroups: Array<Record<string, unknown>>) {
  return pathGroups.reduce<Record<string, any>>((acc, group) => {
    for (const [path, definition] of Object.entries(group)) {
      if (!acc[path]) {
        acc[path] = {};
      }
      Object.assign(acc[path], definition);
    }
    return acc;
  }, {});
}

export function createOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Mnemos API',
      description: 'HTTP API for the Mnemos application',
      version: '1.0.0',
    },
    servers: [{ url: '/' }],
    tags: [
      { name: 'System', description: 'System and infrastructure endpoints' },
      { name: 'Records', description: 'CRUD endpoints for records' },
    ],
    paths: mergePaths(systemOpenApiPaths, recordsOpenApiPaths),
    components: {
      schemas: {
        HealthResponse: HealthResponseSchema,
        RecordDto: RecordSchema,
        RecordDtoList: RecordListSchema,
        RecordCreateInput: CreateRecordBodySchema,
        RecordUpdateInput: UpdateRecordBodySchema,
        RecordDeleteResponse: DeleteRecordResponseSchema,
        ErrorResponse: ErrorResponseSchema,
      },
    },
  } as const;
}
