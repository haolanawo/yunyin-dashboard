'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();
const STALE = 5 * 60 * 1000;
const PAGE_SIZE = 1000;

export type PlatformKey = 'zhihu' | 'bilibili';

export interface PlatformDist {
  platform: string;
  count: number;
  likes: number;
}

export interface MetricTrend {
  date: string;
  likes: number;
  comments: number;
}

export interface BilibiliInteractionSummary {
  likes: number;
  favorites: number;
  coins: number;
  shares: number;
  videos: number;
}

async function fetchAllContents() {
  const rows: Array<{
    content_id: string;
    platform: string | null;
    publish_date?: string | null;
    like_count: number | null;
    favorite_count?: number | null;
    coin_count?: number | null;
    share_count?: number | null;
  }> = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('contents')
      .select('content_id, platform, publish_date, like_count, favorite_count, coin_count, share_count')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

async function fetchAllMetrics() {
  const rows: Array<{ content_id: string; votes: number | null; comments: number | null; snapshot_date?: string | null }> = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('metrics_daily')
      .select('content_id, votes, comments, snapshot_date')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

function aggregateMaxVotes(rows: Array<{ content_id: string; votes: number | null }>) {
  const maxMap = new Map<string, number>();
  rows.forEach((row) => {
    maxMap.set(row.content_id, Math.max(maxMap.get(row.content_id) ?? 0, Number(row.votes ?? 0)));
  });
  return maxMap;
}

export function usePlatformDistribution() {
  return useQuery({
    queryKey: ['platform-distribution-paginated'],
    queryFn: async () => {
      const [contents, metrics] = await Promise.all([fetchAllContents(), fetchAllMetrics()]);
      const zhihuVoteMap = aggregateMaxVotes(metrics);
      const counts: Record<string, PlatformDist> = {};

      contents.forEach((row) => {
        const platform = row.platform ?? 'unknown';
        if (!counts[platform]) counts[platform] = { platform, count: 0, likes: 0 };
        counts[platform].count += 1;
        counts[platform].likes +=
          platform === 'bilibili'
            ? Number(row.like_count ?? 0)
            : Number(zhihuVoteMap.get(row.content_id) ?? 0);
      });

      return Object.values(counts);
    },
    staleTime: STALE,
  });
}

export function useMetricsTrend(platform: PlatformKey) {
  return useQuery({
    queryKey: ['metrics-trend-platform', platform],
    queryFn: async (): Promise<MetricTrend[]> => {
      if (platform === 'bilibili') return [];

      const { data, error } = await supabase.rpc('get_metrics_trend');
      if (error) throw error;

      return ((data ?? []) as Array<{
        snapshot_date: string;
        total_votes: number | string | null;
        total_comments: number | string | null;
      }>).map((row): MetricTrend => ({
        date: row.snapshot_date,
        likes: Number(row.total_votes ?? 0),
        comments: Number(row.total_comments ?? 0),
      }));
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useBilibiliInteractionSummary() {
  return useQuery({
    queryKey: ['bilibili-interaction-summary'],
    queryFn: async (): Promise<BilibiliInteractionSummary> => {
      const contents = (await fetchAllContents()).filter((row) => row.platform === 'bilibili');
      return contents.reduce(
        (acc, row) => ({
          likes: acc.likes + Number(row.like_count ?? 0),
          favorites: acc.favorites + Number(row.favorite_count ?? 0),
          coins: acc.coins + Number(row.coin_count ?? 0),
          shares: acc.shares + Number(row.share_count ?? 0),
          videos: acc.videos + 1,
        }),
        { likes: 0, favorites: 0, coins: 0, shares: 0, videos: 0 },
      );
    },
    staleTime: STALE,
  });
}

export interface TopContent {
  content_id: string;
  title: string | null;
  platform: string;
  votes: number;
  publish_date: string | null;
}

export function useTopContents(limit: number = 10) {
  return useQuery({
    queryKey: ['top-contents-by-votes', limit],
    queryFn: async () => {
      const { data: metrics, error: mErr } = await supabase
        .from('metrics_daily')
        .select('content_id, votes')
        .order('votes', { ascending: false })
        .limit(limit * 3);
      if (mErr) throw mErr;

      const voteMap = aggregateMaxVotes(metrics ?? []);
      const topIds = [...voteMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      if (topIds.length === 0) return [];

      const { data: contents, error: cErr } = await supabase
        .from('contents')
        .select('content_id, title, platform, publish_date')
        .in('content_id', topIds);
      if (cErr) throw cErr;

      const contentMap = new Map((contents ?? []).map((c) => [c.content_id, c]));

      return topIds
        .map((id): TopContent | null => {
          const c = contentMap.get(id);
          if (!c) return null;
          return {
            content_id: id,
            title: c.title ?? null,
            platform: c.platform ?? 'zhihu',
            votes: voteMap.get(id) ?? 0,
            publish_date: c.publish_date ?? null,
          };
        })
        .filter(Boolean) as TopContent[];
    },
    staleTime: STALE,
  });
}

export interface AccountComparisonItem {
  account_name: string;
  content_count: number;
  total_votes: number;
}

export function useAccountComparison() {
  return useQuery({
    queryKey: ['account-comparison-v2'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_account_comparison');
      if (error) throw error;

      return ((data ?? []) as Array<{
        account_name: string | null;
        content_count: number | string | null;
        total_votes: number | string | null;
      }>).map((row): AccountComparisonItem => ({
        account_name: row.account_name ?? 'unknown',
        content_count: Number(row.content_count ?? 0),
        total_votes: Number(row.total_votes ?? 0),
      }));
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
