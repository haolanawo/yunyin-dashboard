import { NextRequest, NextResponse } from 'next/server';
import { getMetricTrend, type AnalyticsPlatform } from '@/lib/server/analyticsAggregations';
import { respondWithCache } from '@/lib/server/cachedRoute';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get('platform');
  if (platform !== 'zhihu' && platform !== 'bilibili') {
    return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 });
  }

  return respondWithCache(request, {
    cacheKey: `analytics:metric-trend:platform=${platform}`,
    invalidatePrefix: 'analytics:metric-trend:',
    loader: () => getMetricTrend(platform as AnalyticsPlatform),
    sourceWindow: 'last-90-days',
  });
}
