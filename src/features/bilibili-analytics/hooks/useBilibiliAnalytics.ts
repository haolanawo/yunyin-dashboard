'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCachedApi, type CachedApiResponse } from '@/lib/client/cachedApi';

const LONG_STALE = 1000 * 60 * 60 * 24;

export interface UpVideoCount {
  account_name: string;
  account_id: string;
  count: number;
}

export interface UpViewRanking {
  account_name: string;
  account_id: string;
  total_views: number;
}

export interface UpInteraction {
  account_name: string;
  account_id: string;
  total_likes: number;
  total_favorites: number;
  total_coins: number;
  total_shares: number;
  total_danmaku: number;
  total_comments: number;
  total_views: number;
  interaction_rate: number;
}

interface BilibiliOverviewPayload {
  videoCounts: UpVideoCount[];
  viewRanking: UpViewRanking[];
  interactions: UpInteraction[];
}

export function useBilibiliVideoCounts() {
  return useQuery<CachedApiResponse<BilibiliOverviewPayload>, Error, UpVideoCount[]>({
    queryKey: ['bilibili-video-counts'],
    queryFn: () => fetchCachedApi<BilibiliOverviewPayload>('/api/analytics/bilibili-overview'),
    select: (payload) => payload.data.videoCounts,
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
  });
}

export function useBilibiliViewRanking() {
  return useQuery<CachedApiResponse<BilibiliOverviewPayload>, Error, UpViewRanking[]>({
    queryKey: ['bilibili-view-ranking'],
    queryFn: () => fetchCachedApi<BilibiliOverviewPayload>('/api/analytics/bilibili-overview'),
    select: (payload) => payload.data.viewRanking,
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
  });
}

export function useBilibiliInteractions() {
  return useQuery<CachedApiResponse<BilibiliOverviewPayload>, Error, UpInteraction[]>({
    queryKey: ['bilibili-interaction-rates'],
    queryFn: () => fetchCachedApi<BilibiliOverviewPayload>('/api/analytics/bilibili-overview'),
    select: (payload) => payload.data.interactions,
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
  });
}
