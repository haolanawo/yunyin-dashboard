'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCachedApi, type CachedApiResponse } from '@/lib/client/cachedApi';

const LONG_STALE = 1000 * 60 * 60 * 24;

export type PlatformKey = 'zhihu' | 'bilibili';

export interface PlatformDist {
  platform: string;
  count: number;
  likes: number;
  traffic: number;
}

export interface MetricTrend {
  date: string;
  label: string;
  likes: number;
  comments: number;
  hasObservation: boolean;
}

export interface BilibiliInteractionSummary {
  likes: number;
  favorites: number;
  coins: number;
  shares: number;
  videos: number;
}

export interface TopContent {
  content_id: string;
  title: string | null;
  platform: string;
  votes: number;
  publish_date: string | null;
}

export interface AccountComparisonItem {
  account_name: string;
  content_count: number;
  total_votes: number;
}

export function usePlatformDistribution() {
  return useQuery<CachedApiResponse<PlatformDist[]>>({
    queryKey: ['platform-distribution-traffic'],
    queryFn: () => fetchCachedApi<PlatformDist[]>('/api/analytics/platform-distribution'),
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
  });
}

export function useMetricsTrend(platform: PlatformKey) {
  return useQuery<CachedApiResponse<MetricTrend[]>>({
    queryKey: ['metrics-trend-platform-dynamic', platform],
    queryFn: () => fetchCachedApi<MetricTrend[]>(`/api/analytics/metric-trend?platform=${platform}`),
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
  });
}

export function useBilibiliInteractionSummary() {
  return useQuery({
    queryKey: ['bilibili-interaction-summary'],
    queryFn: async (): Promise<BilibiliInteractionSummary> => {
      const payload = await fetchCachedApi<{
        interactions: Array<{
          total_likes: number;
          total_favorites: number;
          total_coins: number;
          total_shares: number;
        }>;
        videoCounts: Array<{ count: number }>;
      }>('/api/analytics/bilibili-overview');

      return {
        likes: payload.data.interactions.reduce((sum, item) => sum + item.total_likes, 0),
        favorites: payload.data.interactions.reduce((sum, item) => sum + item.total_favorites, 0),
        coins: payload.data.interactions.reduce((sum, item) => sum + item.total_coins, 0),
        shares: payload.data.interactions.reduce((sum, item) => sum + item.total_shares, 0),
        videos: payload.data.videoCounts.reduce((sum, item) => sum + item.count, 0),
      };
    },
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
  });
}

export function useTopContents(limit: number = 10) {
  return useQuery<CachedApiResponse<TopContent[]>>({
    queryKey: ['top-contents-by-votes', limit],
    queryFn: () => fetchCachedApi<TopContent[]>(`/api/analytics/top-contents?limit=${limit}`),
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
  });
}

export function useAccountComparison() {
  return useQuery<CachedApiResponse<AccountComparisonItem[]>>({
    queryKey: ['account-comparison-v2'],
    queryFn: () => fetchCachedApi<AccountComparisonItem[]>('/api/analytics/account-comparison'),
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
  });
}
