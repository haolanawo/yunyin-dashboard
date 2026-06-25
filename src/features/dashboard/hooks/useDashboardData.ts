'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCachedApi, type CachedApiResponse } from '@/lib/client/cachedApi';

const LONG_STALE = 1000 * 60 * 60 * 24;

export interface RecentContent {
  content_id: string;
  title: string;
  platform: string;
  publish_date: string;
  account_name: string;
}

export interface PlatformOverview {
  platform: 'zhihu' | 'bilibili';
  label: string;
  accounts: number;
  contents: number;
  views: number;
  likes: number;
  comments: number;
  favorites: number;
  coins: number;
  shares: number;
  danmaku: number;
  interactions: number;
  contentShare: number;
  interactionShare: number;
  avgInteractionPerContent: number;
  contentPerAccount: number;
  likeRate: number;
  commentRate: number;
  interactionRate: number;
}

export interface ExecutiveOverview {
  platformCount: number;
  accountCount: number;
  contentCount: number;
  totalViews: number;
  totalInteractions: number;
  totalLikes: number;
  totalComments: number;
  avgInteractionPerContent: number;
  contentPerAccount: number;
  interactionRate: number;
  bilibiliViewShare: number;
  platforms: PlatformOverview[];
}

export function useExecutiveOverview() {
  return useQuery<CachedApiResponse<ExecutiveOverview>>({
    queryKey: ['executive-overview-v3'],
    queryFn: () => fetchCachedApi<ExecutiveOverview>('/api/dashboard/executive-overview'),
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
  });
}

export function useRecentContents(limit: number = 6) {
  return useQuery<CachedApiResponse<RecentContent[]>>({
    queryKey: ['recent-contents-v3', limit],
    queryFn: () => fetchCachedApi<RecentContent[]>(`/api/dashboard/recent-contents?limit=${limit}`),
    staleTime: LONG_STALE,
    refetchOnWindowFocus: false,
  });
}
