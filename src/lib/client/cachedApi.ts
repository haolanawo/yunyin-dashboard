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
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error ?? json?.message ?? 'Request failed.');
  }
  return json as CachedApiResponse<T>;
}
