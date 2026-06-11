'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

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
}

/** video count per UP */
export function useBilibiliVideoCounts() {
  return useQuery({
    queryKey: ['bilibili-video-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select('account_id')
        .eq('platform', 'bilibili');

      if (error) throw error;

      const counts = new Map<string, number>();
      (data ?? []).forEach((c) => {
        if (c.account_id) counts.set(c.account_id, (counts.get(c.account_id) ?? 0) + 1);
      });

      const accountIds = [...counts.keys()];
      const accountMap = new Map<string, string>();
      if (accountIds.length > 0) {
        const { data: accounts } = await supabase
          .from('bilibili_accounts')
          .select('account_id, account_name')
          .in('account_id', accountIds);
        (accounts ?? []).forEach((a) => accountMap.set(a.account_id, a.account_name ?? 'Unknown'));
      }

      return [...counts.entries()]
        .map(([account_id, count]) => ({
          account_id,
          account_name: accountMap.get(account_id) ?? account_id,
          count,
        }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** total play count per UP */
export function useBilibiliViewRanking() {
  return useQuery({
    queryKey: ['bilibili-view-ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select('account_id, play_count')
        .eq('platform', 'bilibili');

      if (error) throw error;

      const upMap = new Map<string, number>();
      (data ?? []).forEach((c) => {
        if (c.account_id) upMap.set(c.account_id, (upMap.get(c.account_id) ?? 0) + (c.play_count ?? 0));
      });

      const accountIds = [...upMap.keys()];
      const accountMap = new Map<string, string>();
      if (accountIds.length > 0) {
        const { data: accounts } = await supabase
          .from('bilibili_accounts')
          .select('account_id, account_name')
          .in('account_id', accountIds);
        (accounts ?? []).forEach((a) => accountMap.set(a.account_id, a.account_name ?? 'Unknown'));
      }

      return [...upMap.entries()]
        .map(([account_id, total_views]) => ({
          account_id,
          account_name: accountMap.get(account_id) ?? account_id,
          total_views,
        }))
        .sort((a, b) => b.total_views - a.total_views);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** total interactions per UP */
export function useBilibiliInteractions() {
  return useQuery({
    queryKey: ['bilibili-interactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select('account_id, like_count, coin_count, favorite_count, share_count, danmaku_count')
        .eq('platform', 'bilibili');

      if (error) throw error;

      const upMap = new Map<string, UpInteraction>();
      (data ?? []).forEach((c) => {
        if (!c.account_id) return;
        const e = upMap.get(c.account_id) ?? {
          account_id: c.account_id,
          account_name: c.account_id,
          total_likes: 0, total_favorites: 0, total_coins: 0, total_shares: 0, total_danmaku: 0,
        };
        e.total_likes += c.like_count ?? 0;
        e.total_favorites += c.favorite_count ?? 0;
        e.total_coins += c.coin_count ?? 0;
        e.total_shares += c.share_count ?? 0;
        e.total_danmaku += c.danmaku_count ?? 0;
        upMap.set(c.account_id, e);
      });

      const accountIds = [...upMap.keys()];
      const accountMap = new Map<string, string>();
      if (accountIds.length > 0) {
        const { data: accounts } = await supabase
          .from('bilibili_accounts')
          .select('account_id, account_name')
          .in('account_id', accountIds);
        (accounts ?? []).forEach((a) => accountMap.set(a.account_id, a.account_name ?? 'Unknown'));
      }

      return [...upMap.values()]
        .map((e) => ({ ...e, account_name: accountMap.get(e.account_id) ?? e.account_id }))
        .sort((a, b) => (b.total_likes + b.total_favorites) - (a.total_likes + a.total_favorites));
    },
    staleTime: 5 * 60 * 1000,
  });
}