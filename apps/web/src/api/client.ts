export async function api<TResponse>(input: RequestInfo | URL, init: RequestInit = {}): Promise<TResponse> {
  const hasBody = init.body !== undefined && init.body !== null;

  const headers = {
    ...(hasBody ? { 'content-type': 'application/json' } : {}),
    ...(init.headers || {}),
  };

  const r = await fetch(input, {
    headers,
    credentials: 'include',
    ...init,
  });

  if (r.status === 204) return null as unknown as TResponse;

  const text = await r.text();
  if (!r.ok) {
    try {
      const j = JSON.parse(text);
      throw new Error(j.error || j.message || r.statusText);
    } catch {
      throw new Error(text || r.statusText);
    }
  }
  return text ? (JSON.parse(text) as TResponse) : (null as unknown as TResponse);
}
