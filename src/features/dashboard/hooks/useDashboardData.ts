'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();
const STALE = 5 * 60 * 1000;

export interface RecentContent {
  content_id: string;
  title: string | null;
  platform: string;
  publish_date: string | null;
  account_name: string | null;
}

export interface ExecutiveOverview {
  platformCount: number;
  accountCount: number;
  contentCount: number;
  totalLikes: number;
  zhihuAccounts: number;
  bilibiliAccounts: number;
  zhihuContents: number;
  bilibiliContents: number;
  zhihuLikes: number;
  bilibiliLikes: number;
}

function maxMetricByContent(rows: Array<{ content_id: string; votes: number | null }>) {
  const maxMap = new Map<string, number>();
  rows.forEach((row) => {
    const current = maxMap.get(row.content_id) ?? 0;
    maxMap.set(row.content_id, Math.max(current, Number(row.votes ?? 0)));
  });
  return [...maxMap.values()].reduce((sum, value) => sum + value, 0);
}

export function useExecutiveOverview() {
  return useQuery({
    queryKey: ['executive-overview'],
    queryFn: async (): Promise<ExecutiveOverview> => {
      const [{ count: zhihuAccounts, error: zhErr }, { count: bilibiliAccounts, error: biErr }] =
        await Promise.all([
          supabase.from('zhihu_accounts').select('*', { count: 'exact', head: true }),
          supabase.from('bilibili_accounts').select('*', { count: 'exact', head: true }),
        ]);

      if (zhErr) throw zhErr;
      if (biErr) throw biErr;

      const { data: contents, error: cErr } = await supabase
        .from('contents')
        .select('content_id, platform, like_count')
        .range(0, 49999);
      if (cErr) throw cErr;

      const { data: metrics, error: mErr } = await supabase
        .from('metrics_daily')
        .select('content_id, votes')
        .range(0, 49999);
      if (mErr) throw mErr;

      const zhihuContents = (contents ?? []).filter((item) => item.platform === 'zhihu').length;
      const bilibiliContents = (contents ?? []).filter((item) => item.platform === 'bilibili').length;
      const bilibiliLikes = (contents ?? [])
        .filter((item) => item.platform === 'bilibili')
        .reduce((sum, item) => sum + Number(item.like_count ?? 0), 0);
      const zhihuLikes = maxMetricByContent(metrics ?? []);

      return {
        platformCount: 2,
        accountCount: (zhihuAccounts ?? 0) + (bilibiliAccounts ?? 0),
        contentCount: contents?.length ?? 0,
        totalLikes: zhihuLikes + bilibiliLikes,
        zhihuAccounts: zhihuAccounts ?? 0,
        bilibiliAccounts: bilibiliAccounts ?? 0,
        zhihuContents,
        bilibiliContents,
        zhihuLikes,
        bilibiliLikes,
      };
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
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

      const zhihuIds = [
        ...new Set((data ?? []).filter((c) => c.platform === 'zhihu').map((c) => c.account_id).filter(Boolean)),
      ] as string[];
      const bilibiliIds = [
        ...new Set((data ?? []).filter((c) => c.platform === 'bilibili').map((c) => c.account_id).filter(Boolean)),
      ] as string[];

      const accountMap = new Map<string, string>();
      if (zhihuIds.length > 0) {
        const { data: accounts } = await supabase
          .from('zhihu_accounts')
          .select('account_id, account_name')
          .in('account_id', zhihuIds);
        (accounts ?? []).forEach((a) => accountMap.set(a.account_id, a.account_name ?? '未知账号'));
      }
      if (bilibiliIds.length > 0) {
        const { data: accounts } = await supabase
          .from('bilibili_accounts')
          .select('account_id, account_name')
          .in('account_id', bilibiliIds);
        (accounts ?? []).forEach((a) => accountMap.set(a.account_id, a.account_name ?? '未知账号'));
      }

      return (data ?? []).map((c): RecentContent => ({
        content_id: c.content_id,
        title: c.title,
        platform: c.platform ?? 'zhihu',
        publish_date: c.publish_date,
        account_name: c.account_id ? (accountMap.get(c.account_id) ?? '未知账号') : '未知账号',
      }));
    },
    staleTime: STALE,
  });
}
