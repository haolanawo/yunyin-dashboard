'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export interface AccountCard {
  id: string;
  nickname: string;
  avatar: string | null;
  platform: 'zhihu' | 'bilibili';
  content_count: number;
  total_views: number | null;
  total_interactions: number | null;
  bilibili_uid: string | null;
  account_id: string;
}

export function useAllAccounts() {
  return useQuery({
    queryKey: ['all-accounts'],
    queryFn: async () => {
      const accounts: AccountCard[] = [];

      // 1. Zhihu accounts
      const { data: zhAccounts, error: zhErr } = await supabase
        .from('zhihu_accounts')
        .select('account_id, account_name')
        .limit(500);

      if (zhErr) throw zhErr;

      if (zhAccounts?.length) {
        const zhIds = zhAccounts.map((a) => a.account_id);
        const { data: zhContents } = await supabase
          .from('contents')
          .select('account_id, content_id')
          .in('account_id', zhIds)
          .limit(5000);

        const contentCounts = new Map<string, number>();
        (zhContents ?? []).forEach((c) => contentCounts.set(c.account_id, (contentCounts.get(c.account_id) ?? 0) + 1));

        const zhContentIds = (zhContents ?? []).map((c) => c.content_id);
        const interMap = new Map<string, number>();
        if (zhContentIds.length > 0) {
          const { data: zhMetrics } = await supabase
            .from('metrics_daily')
            .select('content_id, votes, comments')
            .in('content_id', zhContentIds)
            .limit(5000);
          (zhMetrics ?? []).forEach((m) => {
            const total = Number(m.votes ?? 0) + Number(m.comments ?? 0);
            const content = (zhContents ?? []).find((c) => c.content_id === m.content_id);
            if (content) interMap.set(content.account_id, (interMap.get(content.account_id) ?? 0) + total);
          });
        }

        zhAccounts.forEach((a) => {
          accounts.push({
            id: a.account_id,
            nickname: a.account_name ?? 'Unknown',
            avatar: null,
            platform: 'zhihu',
            content_count: contentCounts.get(a.account_id) ?? 0,
            total_views: null,
            total_interactions: interMap.get(a.account_id) ?? 0,
            bilibili_uid: null,
            account_id: a.account_id,
          });
        });
      }

      // 2. Bilibili accounts
      const { data: biAccounts, error: biErr } = await supabase
        .from('bilibili_accounts')
        .select('account_id, account_name')
        .limit(500);

      if (!biErr && biAccounts?.length) {
        const biIds = biAccounts.map((a) => a.account_id);
        const { data: biContents } = await supabase
          .from('contents')
          .select('account_id, like_count, coin_count, favorite_count, share_count')
          .eq('platform', 'bilibili')
          .in('account_id', biIds)
          .limit(5000);

        const contentCounts = new Map<string, number>();
        const interMap = new Map<string, number>();
        (biContents ?? []).forEach((c) => {
          contentCounts.set(c.account_id, (contentCounts.get(c.account_id) ?? 0) + 1);
          const total = (c.like_count ?? 0) + (c.coin_count ?? 0) + (c.favorite_count ?? 0) + (c.share_count ?? 0);
          interMap.set(c.account_id, (interMap.get(c.account_id) ?? 0) + total);
        });

        biAccounts.forEach((a) => {
          accounts.push({
            id: a.account_id,
            nickname: a.account_name ?? 'Unknown',
            avatar: null,
            platform: 'bilibili',
            content_count: contentCounts.get(a.account_id) ?? 0,
            total_views: null,
            total_interactions: interMap.get(a.account_id) ?? 0,
            bilibili_uid: a.account_id,
            account_id: a.account_id,
          });
        });
      }

      return accounts;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
