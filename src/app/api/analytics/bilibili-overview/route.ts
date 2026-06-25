import { NextRequest } from 'next/server';
import { getBilibiliOverview } from '@/lib/server/analyticsAggregations';
import { respondWithCache } from '@/lib/server/cachedRoute';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return respondWithCache(request, {
    cacheKey: 'analytics:bilibili-overview',
    invalidatePrefix: 'analytics:bilibili-overview',
    loader: getBilibiliOverview,
  });
}
