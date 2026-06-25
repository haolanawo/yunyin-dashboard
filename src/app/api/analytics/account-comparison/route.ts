import { NextRequest } from 'next/server';
import { getAccountComparison } from '@/lib/server/analyticsAggregations';
import { respondWithCache } from '@/lib/server/cachedRoute';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return respondWithCache(request, {
    cacheKey: 'analytics:account-comparison',
    invalidatePrefix: 'analytics:',
    loader: getAccountComparison,
  });
}
