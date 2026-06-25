import { NextRequest } from 'next/server';
import { getTopContents } from '@/lib/server/analyticsAggregations';
import { respondWithCache } from '@/lib/server/cachedRoute';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '10');
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 10;

  return respondWithCache(request, {
    cacheKey: `analytics:top-contents:limit=${safeLimit}`,
    invalidatePrefix: 'analytics:top-contents:',
    loader: () => getTopContents(safeLimit),
  });
}
