'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();
const PAGE_SIZE = 50;

export interface BilibiliVideo {
  content_id: string;
  title: string | null;
  account_name: string | null;
  account_id: string | null;
  publish_date: string | null;
  content_url: string | null;
  play_count: number | null;
  like_count: number | null;
  coin_count: number | null;
  favorite_count: number | null;
  share_count: number | null;
  danmaku_count: number | null;
  reply_count: number | null;
}

export function useBilibiliVideos(page: number = 0) {
  return useQuery({
    queryKey: ['bilibili-videos', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Fetch contents WHERE platform='bilibili', paginated
      const { data: contents, error: cErr, count } = await supabase
        .from('contents')
        .select('content_id, title, account_id, publish_date, content_url, play_count, like_count, coin_count, favorite_count, share_count, danmaku_count', { count: 'exact' })
        .eq('platform', 'bilibili')
        .order('publish_date', { ascending: false, nullsFirst: false })
        .range(from, to);

      if (cErr) throw cErr;
      if (!contents || contents.length === 0) {
        return { videos: [] as BilibiliVideo[], total: count ?? 0 };
      }

      const contentIds = contents.map((c) => c.content_id);
      const { data: snapshots } = await supabase
        .from('content_metric_snapshots')
        .select('content_id, snapshot_date, comments')
        .in('content_id', contentIds)
        .order('snapshot_date', { ascending: false });
      const commentMap = new Map<string, number>();
      (snapshots ?? []).forEach((s) => {
        if (!commentMap.has(s.content_id)) {
          commentMap.set(s.content_id, Number(s.comments ?? 0));
        }
      });

      // Fetch account names from bilibili_accounts
      const accountIds = [...new Set((contents ?? []).map((c) => c.account_id).filter(Boolean))] as string[];
      const accountMap = new Map<string, string>();
      if (accountIds.length > 0) {
        const { data: accounts } = await supabase
          .from('bilibili_accounts')
          .select('account_id, account_name')
          .in('account_id', accountIds);
        (accounts ?? []).forEach((a) => accountMap.set(a.account_id, a.account_name ?? 'Unknown'));
      }

      const videos: BilibiliVideo[] = contents.map((c) => ({
        content_id: c.content_id,
        title: c.title ?? null,
        account_id: c.account_id ?? null,
        account_name: c.account_id ? (accountMap.get(c.account_id) ?? 'Unknown') : 'Unknown',
        publish_date: c.publish_date ?? null,
        content_url: c.content_url ?? null,
        play_count: c.play_count ?? null,
        like_count: c.like_count ?? null,
        coin_count: c.coin_count ?? null,
        favorite_count: c.favorite_count ?? null,
        share_count: c.share_count ?? null,
        danmaku_count: c.danmaku_count ?? null,
        reply_count: commentMap.get(c.content_id) ?? null,
      }));

      return { videos, total: count ?? videos.length };
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
