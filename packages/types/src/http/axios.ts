export type Primitive = string | number | boolean | null | undefined;

export type AxiosMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

export type QueryParams = Record<string, Primitive | Primitive[]> | undefined;

export interface AxiosRequestConfig {
  baseURL?: string;
  url?: string;
  method?: AxiosMethod | Lowercase<AxiosMethod>;
  headers?: Record<string, string>;
  params?: QueryParams;
  data?: unknown;
  withCredentials?: boolean;
  signal?: AbortSignal;
}

export interface AxiosResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: Required<Pick<AxiosRequestConfig, 'url' | 'method'>> & AxiosRequestConfig;
}

export class AxiosError<T = unknown> extends Error {
  response?: AxiosResponse<T>;
  status?: number;
  config: AxiosRequestConfig;

  constructor(message: string, config: AxiosRequestConfig, response?: AxiosResponse<T>) {
    super(message);
    this.name = 'AxiosError';
    this.config = config;
    this.response = response;
    this.status = response?.status;
  }
}

export interface AxiosInstance {
  defaults: AxiosRequestConfig;
  request<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  get<T = unknown>(url: string, config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>): Promise<AxiosResponse<T>>;
  delete<T = unknown>(url: string, config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>): Promise<AxiosResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: Omit<AxiosRequestConfig, 'url' | 'method'>): Promise<AxiosResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: Omit<AxiosRequestConfig, 'url' | 'method'>): Promise<AxiosResponse<T>>;
}

export interface CreateAxiosOptions extends AxiosRequestConfig {
  /**
   * Whether requests should include credentials (cookies).
   * Defaults to true to keep backwards compatibility with fetch-based client.
   */
  withCredentials?: boolean;
}

function toUpperMethod(method?: AxiosRequestConfig['method']): AxiosMethod {
  const value = method?.toString().toUpperCase() as AxiosMethod | undefined;
  return value ?? 'GET';
}

function buildUrl(baseURL = '', url = '', params?: QueryParams) {
  const normalizedBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  const normalizedPath = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `${normalizedBase}${url}`;

  if (!params) return normalizedPath;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        searchParams.append(key, String(item));
      }
    } else {
      searchParams.append(key, String(value));
    }
  }

  const query = searchParams.toString();
  if (!query) return normalizedPath;
  return `${normalizedPath}${normalizedPath.includes('?') ? '&' : '?'}${query}`;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.status === 204 ? null : await response.json();
  }
  if (contentType.startsWith('text/')) {
    return await response.text();
  }
  return response.status === 204 ? null : await response.arrayBuffer();
}

function normalizeHeaders(headers?: Record<string, string>) {
  if (!headers) return undefined;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key.toLowerCase()] = value;
  }
  return result;
}

export function createAxiosInstance(defaults: CreateAxiosOptions = {}): AxiosInstance {
  const baseDefaults: AxiosRequestConfig = {
    baseURL: defaults.baseURL ?? '',
    headers: defaults.headers ?? {},
    withCredentials: defaults.withCredentials ?? true,
  };

  async function request<T>(requestConfig: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const mergedConfig: AxiosRequestConfig = {
      ...baseDefaults,
      ...requestConfig,
      headers: {
        ...(normalizeHeaders(baseDefaults.headers) ?? {}),
        ...(normalizeHeaders(requestConfig.headers) ?? {}),
      },
    };

    if (!mergedConfig.url) {
      throw new Error('Request URL is required');
    }

    const method = toUpperMethod(mergedConfig.method);
    const targetUrl = buildUrl(mergedConfig.baseURL, mergedConfig.url, mergedConfig.params);

    const headers: Record<string, string> = { ...(mergedConfig.headers ?? {}) };
    let body: BodyInit | undefined;

    if (mergedConfig.data !== undefined && mergedConfig.data !== null) {
      if (typeof mergedConfig.data === 'string' || mergedConfig.data instanceof FormData) {
        body = mergedConfig.data as BodyInit;
      } else {
        body = JSON.stringify(mergedConfig.data);
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
      }
    }

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      credentials: mergedConfig.withCredentials ? 'include' : 'same-origin',
      signal: mergedConfig.signal,
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const responseData = await parseResponseBody(response);

    const axiosResponse: AxiosResponse<T> = {
      data: responseData as T,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      config: {
        ...mergedConfig,
        url: mergedConfig.url,
        method,
      },
    };

    if (!response.ok) {
      throw new AxiosError<T>(`Request failed with status code ${response.status}`, mergedConfig, axiosResponse);
    }

    return axiosResponse;
  }

  return {
    defaults: { ...baseDefaults },
    request,
    get(url, config) {
      return request({ ...config, url, method: 'GET' });
    },
    delete(url, config) {
      return request({ ...config, url, method: 'DELETE' });
    },
    post(url, data, config) {
      return request({ ...config, url, data, method: 'POST' });
    },
    put(url, data, config) {
      return request({ ...config, url, data, method: 'PUT' });
    },
  } satisfies AxiosInstance;
}
