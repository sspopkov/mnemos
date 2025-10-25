export * from './openapi';

export type ApiPaths = import('./openapi').Paths;
export type ApiComponents = import('./openapi').Components;

export type HealthResponse = ApiPaths['/api/health']['get']['responses']['200']['content']['application/json'];
export type Record = ApiComponents['schemas']['Record'];
