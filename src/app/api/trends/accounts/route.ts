import { NextRequest, NextResponse } from 'next/server';
import { getTrendAccounts, type TrendPlatform } from '@/lib/server/analyticsAggregations';
import { respondWithCache } from '@/lib/server/cachedRoute';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get('platform');
  if (platform !== 'zhihu' && platform !== 'bilibili') {
    return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 });
  }

  return respondWithCache(request, {
    cacheKey: `trends:accounts:platform=${platform}`,
    invalidatePrefix: 'trends:accounts:',
    loader: () => getTrendAccounts(platform as TrendPlatform),
  });
}
