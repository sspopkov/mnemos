import { prisma } from '../prisma';
import { toRecordEntity } from '../mappers/record.mapper';

export const listRecords = async (userId: string) => {
  const rows = await prisma.record.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toRecordEntity);
};

export const createRecord = async (
  userId: string,
  data: { title: string; content?: string | null },
) => {
  const rec = await prisma.record.create({
    data: { title: data.title, content: data.content ?? null, userId },
  });
  return toRecordEntity(rec);
};

export const updateRecord = async (
  userId: string,
  id: string,
  data: { title?: string; content?: string | null },
) => {
  const existing = await prisma.record.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const rec = await prisma.record.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
    },
  });
  return toRecordEntity(rec);
};

export const deleteRecord = async (userId: string, id: string) => {
  const result = await prisma.record.deleteMany({ where: { id, userId } });
  return result.count > 0;
};
