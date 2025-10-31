import type { HealthResponse } from '../schemas/health.schema';

export const getHealthStatus = async (): Promise<HealthResponse> => ({
  ok: true,
  ts: new Date().toISOString(),
});
