import { NextRequest } from 'next/server';
import { getExecutiveOverview } from '@/lib/server/analyticsAggregations';
import { respondWithCache } from '@/lib/server/cachedRoute';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return respondWithCache(request, {
    cacheKey: 'dashboard:executive-overview',
    invalidatePrefix: 'dashboard:',
    loader: getExecutiveOverview,
  });
}
