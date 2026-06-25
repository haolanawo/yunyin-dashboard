import { NextRequest, NextResponse } from 'next/server';
import { getTrendSeries, type TrendPlatform } from '@/lib/server/analyticsAggregations';
import { respondWithCache } from '@/lib/server/cachedRoute';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const platform = params.get('platform');
  const start = params.get('start');
  const end = params.get('end');
  const accountIds = params.getAll('accountId').filter(Boolean);

  if (platform !== 'zhihu' && platform !== 'bilibili') {
    return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 });
  }

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing date range.' }, { status: 400 });
  }

  if (!accountIds.length) {
    return NextResponse.json({
      data: [],
      cached: false,
      cacheLayer: 'miss',
      generatedAt: new Date().toISOString(),
      cacheKey: `trends:series:platform=${platform}:empty`,
      sourceWindow: `${start}:${end}`,
    });
  }

  const sortedIds = [...accountIds].sort();
  return respondWithCache(request, {
    cacheKey: `trends:series:platform=${platform}:accounts=${sortedIds.join(',')}:start=${start}:end=${end}`,
    invalidatePrefix: 'trends:series:',
    sourceWindow: `${start}:${end}`,
    loader: () => getTrendSeries(platform as TrendPlatform, sortedIds, { start, end }),
  });
}
