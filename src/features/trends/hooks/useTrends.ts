'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCachedApi, type CachedApiResponse } from '@/lib/client/cachedApi';

const LONG_STALE = 1000 * 60 * 60 * 24;

export type TrendPlatform = 'zhihu' | 'bilibili';
export type TrendMetric = 'traffic' | 'interactionRate';

export interface AccountTrend {
  account_name: string;
  account_id: string;
  date: string;
  traffic: number;
  trafficDaily: number | null;
  interactionRate: number;
  hasObservation: boolean;
}

export interface AccountOption {
  account_id: string;
  account_name: string;
}

export function useAccountList(platform: TrendPlatform) {
  return useQuery<CachedApiResponse<AccountOption[]>>({
    queryKey: ['account-list', platform],
    queryFn: () => fetchCachedApi<AccountOption[]>(`/api/trends/accounts?platform=${platform}`),
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
  });
}

export function useAccountTrends(
  platform: TrendPlatform,
  accountIds: string[],
  dateRange: { start: string; end: string },
) {
  const enabled = accountIds.length > 0 && !!dateRange.start && !!dateRange.end;
  const params = new URLSearchParams({
    platform,
    start: dateRange.start,
    end: dateRange.end,
  });
  [...accountIds].sort().forEach((accountId) => params.append('accountId', accountId));

  return useQuery<CachedApiResponse<AccountTrend[]>>({
    queryKey: ['account-trends', platform, [...accountIds].sort(), dateRange],
    queryFn: () => fetchCachedApi<AccountTrend[]>(`/api/trends/series?${params.toString()}`),
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
    enabled,
  });
}
