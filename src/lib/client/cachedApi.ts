'use client';

export interface CachedApiResponse<T> {
  data: T;
  cached: boolean;
  cacheLayer: 'memory' | 'disk' | 'miss';
  generatedAt: string;
  cacheKey: string;
  sourceWindow?: string;
}

export async function fetchCachedApi<T>(url: string): Promise<CachedApiResponse<T>> {
  const response = await fetch(url, {
    cache: 'no-store',
  });
  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    const contentType = response.headers.get('content-type') ?? 'unknown content type';
    throw new Error(`接口返回非 JSON 响应（${response.status} ${contentType}），请刷新或重启本地服务。`);
  }

  if (!response.ok) {
    const errorPayload = json as { error?: string; message?: string } | null;
    throw new Error(errorPayload?.error ?? errorPayload?.message ?? 'Request failed.');
  }
  return json as CachedApiResponse<T>;
}
