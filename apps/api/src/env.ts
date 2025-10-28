import { resolve } from 'node:path';
import { config } from 'dotenv';

type BooleanEnv = 'true' | 'false' | undefined;

type NumberEnv = string | undefined;

config({ path: resolve(__dirname, '../.env') });

const numberFromEnv = (value: NumberEnv, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const booleanFromEnv = (value: BooleanEnv, fallback: boolean): boolean => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

const TEST_ACCESS_TOKEN_TTL = '1m';

const TEST_REFRESH_TOKEN_TTL_DAYS = 2 / (24 * 60);

const TEST_REFRESH_ABSOLUTE_MAX_DAYS = 3 / (24 * 60);

export const env = {
  host: process.env.HOST ?? '0.0.0.0',
  port: numberFromEnv(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? TEST_ACCESS_TOKEN_TTL,
  refreshTokenTtlDays: numberFromEnv(
    process.env.REFRESH_TOKEN_TTL_DAYS,
    TEST_REFRESH_TOKEN_TTL_DAYS,
  ),
  refreshAbsoluteMaxDays: numberFromEnv(
    process.env.REFRESH_ABSOLUTE_MAX_DAYS,
    TEST_REFRESH_ABSOLUTE_MAX_DAYS,
  ),
  refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'mnemos-refresh',
  cookieDomain: process.env.COOKIE_DOMAIN,
  cookieSecure: booleanFromEnv(process.env.COOKIE_SECURE as BooleanEnv, false),
  corsOrigin: process.env.CORS_ORIGIN,
};
