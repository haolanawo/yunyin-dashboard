'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export interface ContentItem {
  content_id: string;
  title: string | null;
  platform: string;
  account_id: string | null;
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

function displayAccountName(accountId: string | null, accountName?: string | null): string {
  const cleanName = accountName?.trim();
  if (cleanName) return cleanName;
  if (accountId?.trim()) return `待补账号 ${accountId.trim()}`;
  return '账号待补';
}

function formatDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return year && month && day ? `${year}-${month}-${day}` : String(value).slice(0, 10);
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
          { count: 'exact' },
        )
        .order('publish_date', { ascending: false, nullsFirst: false })
        .range(from, to);

      if (platform) query = query.eq('platform', platform);
      if (contentType) query = query.eq('content_type', contentType);
      if (search.trim()) query = query.ilike('title', `%${search.trim()}%`);

      const { data, error, count } = await query;
      if (error) throw error;

      const rows = data ?? [];
      const accountIds = [...new Set(rows.map((content) => content.account_id).filter(Boolean))] as string[];
      const contentIds = rows.map((content) => content.content_id);
      const accountMap = new Map<string, string>();
      const scoreMap = new Map<string, number>();

      if (accountIds.length > 0) {
        const [zhihuAccountsById, zhihuAccountsByUid, bilibiliAccounts] = await Promise.all([
          supabase.from('zhihu_accounts').select('account_id, account_name, zhihu_uid').in('account_id', accountIds),
          supabase.from('zhihu_accounts').select('account_id, account_name, zhihu_uid').in('zhihu_uid', accountIds),
          supabase.from('bilibili_accounts').select('account_id, account_name').in('account_id', accountIds),
        ]);

        [...(zhihuAccountsById.data ?? []), ...(zhihuAccountsByUid.data ?? [])].forEach((account) => {
          accountMap.set(account.account_id, displayAccountName(account.account_id, account.account_name));
          if (account.zhihu_uid) {
            accountMap.set(account.zhihu_uid, displayAccountName(account.zhihu_uid, account.account_name));
          }
        });
        (bilibiliAccounts.data ?? []).forEach((account) => {
          accountMap.set(account.account_id, displayAccountName(account.account_id, account.account_name));
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
        items: rows.map((content): ContentItem => ({
          content_id: content.content_id,
          title: content.title,
          platform: content.platform ?? 'zhihu',
          account_id: content.account_id ?? null,
          account_name: displayAccountName(
            content.account_id ?? null,
            content.account_id ? accountMap.get(content.account_id) : null,
          ),
          publish_date: formatDateOnly(content.publish_date),
          content_type: content.content_type,
          ai_score: scoreMap.get(content.content_id) ?? null,
          content_url: content.content_url ?? content.url ?? null,
          question_id: content.question_id ?? null,
        })),
      };
    },
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}
