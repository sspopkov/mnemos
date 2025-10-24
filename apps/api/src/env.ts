import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env') });

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  host: process.env.HOST ?? '0.0.0.0',
  port: numberFromEnv(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL,
};
