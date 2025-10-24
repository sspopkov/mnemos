import { PrismaClient } from '@prisma/client';

import { env } from './env';

export const prisma = new PrismaClient(
  env.databaseUrl
    ? {
        datasources: {
          db: {
            url: env.databaseUrl,
          },
        },
      }
    : undefined,
);

const shutdown = async () => {
  await prisma.$disconnect();
};

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});
