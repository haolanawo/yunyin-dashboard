// ============================================================
// Dashboard 数据查询 Hooks — 优化版（移除 NULL ai_score 引用）
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

/** 最近内容条目类型 */
export interface RecentContent {
  content_id: string;
  title: string | null;
  platform: string;
  publish_date: string | null;
  account_name: string | null;
}

export function useAccountsCount() {
  return useQuery({
    queryKey: ['accounts-count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('zhihu_accounts').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useContentsCount() {
  return useQuery({
    queryKey: ['contents-count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('contents').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTotalVotes() {
  return useQuery({
    queryKey: ['total-votes'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_total_votes');
      if (error) throw error;
      return Number(data ?? 0);
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

/** 最高单篇赞同数 */
export function useMaxVotes() {
  return useQuery({
    queryKey: ['max-votes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metrics_daily')
        .select('votes')
        .order('votes', { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data ?? [])[0]?.votes ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentContents(limit: number = 5) {
  return useQuery({
    queryKey: ['recent-contents', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select('content_id, title, platform, publish_date, account_id')
        .order('publish_date', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;

      const accountIds = [...new Set((data ?? []).map((c) => c.account_id).filter(Boolean))];
      const accountMap = new Map<string, string>();
      if (accountIds.length > 0) {
        const { data: accounts } = await supabase
          .from('zhihu_accounts')
          .select('account_id, account_name')
          .in('account_id', accountIds);
        (accounts ?? []).forEach((a) => accountMap.set(a.account_id, a.account_name ?? '未知'));
      }

      return (data ?? []).map((c): RecentContent => ({
        content_id: c.content_id,
        title: c.title,
        platform: c.platform ?? 'zhihu',
        publish_date: c.publish_date,
        account_name: c.account_id ? (accountMap.get(c.account_id) ?? '未知') : '未知',
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
