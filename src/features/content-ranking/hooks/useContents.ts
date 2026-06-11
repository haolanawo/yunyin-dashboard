'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

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

interface UseContentsListParams {
  page: number;
  pageSize: number;
  search?: string;
  platform?: string;
  contentType?: string;
}

interface ContentsListResult {
  items: ContentItem[];
  total: number;
}

export function useContentsList({
  page,
  pageSize,
  search = '',
  platform = '',
  contentType = '',
}: UseContentsListParams) {
  return useQuery<ContentsListResult, Error>({
    queryKey: ['contents-list', page, pageSize, search, platform, contentType],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('contents')
        .select(
          `
          content_id,
          title,
          platform,
          publish_date,
          content_type,
          account_id,
          content_url,
          url,
          question_id
        `,
          { count: 'exact' }
        )
        .order('publish_date', { ascending: false, nullsFirst: false })
        .range(from, to);

      if (platform) query = query.eq('platform', platform);
      if (contentType) query = query.eq('content_type', contentType);
      if (search.trim()) query = query.ilike('title', `%${search.trim()}%`);

      const { data, error, count } = await query;
      if (error) throw error;

      const rows = data ?? [];
      const accountIds = [...new Set(rows.map((c) => c.account_id).filter(Boolean))] as string[];
      const contentIds = rows.map((c) => c.content_id);
      const accountMap = new Map<string, string>();
      const scoreMap = new Map<string, number>();

      if (accountIds.length > 0) {
        const [zhihuAccounts, bilibiliAccounts] = await Promise.all([
          supabase.from('zhihu_accounts').select('account_id, account_name').in('account_id', accountIds),
          supabase.from('bilibili_accounts').select('account_id, account_name').in('account_id', accountIds),
        ]);

        (zhihuAccounts.data ?? []).forEach((a) => {
          accountMap.set(a.account_id, a.account_name ?? '未知账号');
        });
        (bilibiliAccounts.data ?? []).forEach((a) => {
          accountMap.set(a.account_id, a.account_name ?? '未知账号');
        });
      }

      if (contentIds.length > 0) {
        const { data: labels } = await supabase
          .from('structural_labels')
          .select('content_id, ai_score')
          .in('content_id', contentIds);

        (labels ?? []).forEach((label) => {
          if (label.ai_score !== null && label.ai_score !== undefined) {
            scoreMap.set(label.content_id, Number(label.ai_score));
          }
        });
      }

      return {
        total: count ?? 0,
        items: rows.map((c): ContentItem => ({
          content_id: c.content_id,
          title: c.title,
          platform: c.platform ?? 'zhihu',
          account_name: c.account_id ? (accountMap.get(c.account_id) ?? '未知账号') : '未知账号',
          publish_date: c.publish_date,
          content_type: c.content_type,
          ai_score: scoreMap.get(c.content_id) ?? null,
          content_url: c.content_url ?? c.url ?? null,
          question_id: c.question_id ?? null,
        })),
      };
    },
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}
