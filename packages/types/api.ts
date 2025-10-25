/*
 * Auto-generated client based on packages/types/swagger.json
 * Run `pnpm -F @mnemos/api swagger:export && pnpm -F @mnemos/types gen:api`
 * to refresh this file from the latest API schema.
 */

export interface HealthResponse {
  ok: true;
  ts: string;
}

export interface RecordEntity {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Record = RecordEntity;

export interface CreateRecordBody {
  title: string;
  content?: string | null;
}

export interface UpdateRecordBody {
  title?: string;
  content?: string | null;
}

export interface ErrorResponse {
  error: string;
}

export interface DeleteRecordResponse {
  ok: true;
}

export interface ClientOptions {
  /** API base URL, defaults to an empty string (relative requests). */
  baseUrl?: string;
  /** Custom fetch implementation. */
  fetch?: typeof fetch;
  /** Additional headers sent with every request. */
  headers?: HeadersInit;
}

const defaultOptions: Required<Pick<ClientOptions, 'baseUrl' | 'fetch'>> = {
  baseUrl: '',
  fetch: (typeof globalThis !== 'undefined' && globalThis.fetch) || (async () => {
    throw new Error('Global fetch is not available. Provide a custom fetch implementation.');
  }),
};

function normalizeHeaders(input?: HeadersInit): Record<string, string> {
  if (!input) return {};
  if (typeof Headers !== 'undefined' && input instanceof Headers) {
    const entries: Record<string, string> = {};
    input.forEach((value, key) => {
      entries[key] = value;
    });
    return entries;
  }
  if (Array.isArray(input)) {
    return Object.fromEntries(input);
  }
  return { ...input };
}

async function request<T>(
  path: string,
  init: RequestInit,
  options: ClientOptions,
): Promise<T> {
  const baseUrl = options.baseUrl ?? defaultOptions.baseUrl;
  const fetchImpl = options.fetch ?? defaultOptions.fetch;
  const headers: HeadersInit = {
    'content-type': 'application/json',
    ...normalizeHeaders(options.headers),
    ...normalizeHeaders(init.headers),
  };

  const response = await fetchImpl(`${baseUrl}${path}`, { ...init, headers });
  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch (error) {
      errorBody = await response.text();
    }
    throw Object.assign(new Error(`Request failed with status ${response.status}`), {
      status: response.status,
      body: errorBody,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getHealth(options: ClientOptions = {}): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health', { method: 'GET' }, options);
}

export async function getRecords(options: ClientOptions = {}): Promise<RecordEntity[]> {
  return request<RecordEntity[]>('/api/records', { method: 'GET' }, options);
}

export async function createRecord(
  body: CreateRecordBody,
  options: ClientOptions = {},
): Promise<RecordEntity> {
  return request<RecordEntity>(
    '/api/records',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    options,
  );
}

export async function updateRecord(
  id: string,
  body: UpdateRecordBody,
  options: ClientOptions = {},
): Promise<RecordEntity> {
  return request<RecordEntity>(
    `/api/records/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
    options,
  );
}

export async function deleteRecord(
  id: string,
  options: ClientOptions = {},
): Promise<DeleteRecordResponse> {
  return request<DeleteRecordResponse>(
    `/api/records/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
    options,
  );
}
