import type { Record as PrismaRecord } from '@prisma/client';
import type { RecordEntity } from '../schemas/record.schema';

export const toRecordEntity = (r: PrismaRecord): RecordEntity => ({
  id: r.id,
  title: r.title,
  content: r.content,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});
