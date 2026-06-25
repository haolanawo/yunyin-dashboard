import { NextRequest } from 'next/server';
import { getRecentContents } from '@/lib/server/analyticsAggregations';
import { respondWithCache } from '@/lib/server/cachedRoute';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '6');
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 20) : 6;

  return respondWithCache(request, {
    cacheKey: `dashboard:recent-contents:limit=${safeLimit}`,
    invalidatePrefix: 'dashboard:recent-contents:',
    loader: () => getRecentContents(safeLimit),
  });
}
