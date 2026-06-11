// ============================================================
// Contents 列表查询 Hooks
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();
const LARGE_QUERY_LIMIT = 50000;

export interface ContentItem {
  content_id: string;
  title: string | null;
  platform: string;
  account_name: string | null;
  publish_date: string | null;
  content_type: string | null;
  ai_score: number | null;
  content_url: string | null;
  question_id: string | null;
}

export function useContentsList() {
  return useQuery({
    queryKey: ['contents-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select(`
          content_id,
          title,
          platform,
          publish_date,
          content_type,
          account_id,
          content_url,
          question_id
        `)
        .order('publish_date', { ascending: false, nullsFirst: false })
        .limit(LARGE_QUERY_LIMIT);

      if (error) throw error;

      const accountIds = [...new Set((data ?? []).map((c) => c.account_id).filter(Boolean))];
      const accountMap = new Map<string, string>();
      if (accountIds.length > 0) {
        const { data: accounts } = await supabase
          .from('zhihu_accounts')
          .select('account_id, account_name')
          .in('account_id', accountIds);
        (accounts ?? []).forEach((a) => {
          accountMap.set(a.account_id, a.account_name ?? '未知');
        });
      }

      const contentIds = (data ?? []).map((c) => c.content_id);
      const scoreMap = new Map<string, number>();
      if (contentIds.length > 0) {
        const { data: labels } = await supabase
          .from('structural_labels')
          .select('content_id, ai_score')
          .in('content_id', contentIds)
          .limit(LARGE_QUERY_LIMIT);
        (labels ?? []).forEach((l) => {
          if (l.ai_score !== null && l.ai_score !== undefined) {
            scoreMap.set(l.content_id, Number(l.ai_score));
          }
        });
      }

      return (data ?? []).map((c): ContentItem => ({
        content_id: c.content_id,
        title: c.title,
        platform: c.platform ?? 'zhihu',
        account_name: c.account_id ? (accountMap.get(c.account_id) ?? '未知') : '未知',
        publish_date: c.publish_date,
        content_type: c.content_type,
        ai_score: scoreMap.get(c.content_id) ?? null,
        content_url: c.content_url ?? null,
        question_id: c.question_id ?? null,
      }));
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
