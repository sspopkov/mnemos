export async function api<T>(
    input: RequestInfo,
    init: RequestInit = {}
): Promise<T> {
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

    if (r.status === 204) return null as unknown as T;

    const text = await r.text();
    if (!r.ok) {
        try {
            const j = JSON.parse(text);
            throw new Error(j.error || j.message || r.statusText);
        } catch {
            throw new Error(text || r.statusText);
        }
    }
    return text ? (JSON.parse(text) as T) : (null as unknown as T);
}


export type RecordItem = {
    id: string;
    title: string;
    content?: string | null;
    createdAt: string;
    updatedAt: string;
};

export const RecordsApi = {
    list: () => api<RecordItem[]>('/api/records'),
    create: (data: { title: string; content?: string }) =>
        api<RecordItem>('/api/records', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: string, data: Partial<Pick<RecordItem, 'title' | 'content'>>) =>
        api<RecordItem>(`/api/records/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    remove: (id: string) =>
        api<{ ok: true }>(`/api/records/${id}`, { method: 'DELETE' }),
};
