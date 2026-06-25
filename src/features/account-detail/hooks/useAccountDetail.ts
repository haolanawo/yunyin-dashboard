// ============================================================
// Account Detail Hooks
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();
const LARGE_QUERY_LIMIT = 50000;

export interface AccountInfo {
  account_id: string;
  account_name: string;
  follower_count: number | null;
  total_answers: number | null;
}

export interface AccountPost {
  content_id: string;
  title: string | null;
  platform: string;
  content_type: string | null;
  publish_date: string | null;
  votes: number;
  comments: number;
  ai_score: number | null;
}

export interface AccountDetailData {
  account: AccountInfo;
  posts: AccountPost[];
}

/** 获取账号信息及帖子列表 */
export function useAccountDetail(accountId: string) {
  return useQuery({
    queryKey: ['account-detail', accountId],
    queryFn: async () => {
      // Fetch account
      const { data: account, error: accError } = await supabase
        .from('zhihu_accounts')
        .select('*')
        .eq('account_id', accountId)
        .single();
      if (accError) throw accError;
      if (!account) throw new Error('账号未找到');

      // Fetch contents by this account
      const { data: contents, error: contError } = await supabase
        .from('contents')
        .select('content_id, title, platform, content_type, publish_date')
        .eq('account_id', accountId)
        .order('publish_date', { ascending: false, nullsFirst: false });
      if (contError) throw contError;
      if (!contents || contents.length === 0) {
        return {
          account: {
            account_id: account.account_id,
            account_name: account.account_name ?? '未知',
            follower_count: account.followers ?? null,
            total_answers: account.total_answers ?? null,
          },
          posts: [],
        } as AccountDetailData;
      }

      const contentIds = contents.map((c) => c.content_id);

      // Batch fetch latest metrics
      const { data: metrics } = await supabase
        .from('metrics_daily')
        .select('content_id, votes, comments')
        .in('content_id', contentIds)
        .limit(LARGE_QUERY_LIMIT);
      const metricMap = new Map<string, { votes: number; comments: number }>();
      (metrics ?? []).forEach((m) => {
        const existing = metricMap.get(m.content_id);
        if (!existing || m.votes > existing.votes || m.comments > existing.comments) {
          metricMap.set(m.content_id, { votes: m.votes ?? 0, comments: m.comments ?? 0 });
        }
      });

      // Batch fetch AI scores
      const { data: labels } = await supabase
        .from('structural_labels')
        .select('content_id, ai_score')
        .in('content_id', contentIds);
      const scoreMap = new Map<string, number | null>();
      (labels ?? []).forEach((l) => {
        scoreMap.set(
          l.content_id,
          l.ai_score !== null && l.ai_score !== undefined ? Number(l.ai_score) : null,
        );
      });

      const posts: AccountPost[] = contents.map((c) => {
        const m = metricMap.get(c.content_id);
        return {
          content_id: c.content_id,
          title: c.title,
          platform: c.platform ?? 'zhihu',
          content_type: c.content_type,
          publish_date: c.publish_date,
          votes: m?.votes ?? 0,
          comments: m?.comments ?? 0,
          ai_score: scoreMap.get(c.content_id) ?? null,
        };
      });

      return {
        account: {
          account_id: account.account_id,
          account_name: account.account_name ?? '未知',
          follower_count: account.followers ?? null,
          total_answers: account.total_answers ?? null,
        },
        posts,
      } as AccountDetailData;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!accountId,
  });
}
