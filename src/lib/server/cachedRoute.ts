import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsCache } from './analyticsCache';

export async function respondWithCache<T>(
  request: NextRequest,
  options: {
    cacheKey: string;
    invalidatePrefix?: string;
    sourceWindow?: string;
    ttlMs?: number;
    loader: () => Promise<T>;
  },
) {
  const refresh = request.nextUrl.searchParams.get('refresh') === '1';
  if (refresh) {
    AnalyticsCache.invalidate(options.invalidatePrefix ?? options.cacheKey);
  }

  const payload = await AnalyticsCache.getOrSet(options.cacheKey, options.loader, options.sourceWindow, options.ttlMs);
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400',
      'X-Cache-Layer': payload.cacheLayer,
    },
  });
}
