// ============================================================
// Analytics 数据查询 Hooks
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

/** 平台分布数据 */
export interface PlatformDist {
  platform: string;
  count: number;
}

export function usePlatformDistribution() {
  return useQuery({
    queryKey: ['platform-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select('platform');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((row) => {
        const p = row.platform ?? 'unknown';
        counts[p] = (counts[p] ?? 0) + 1;
      });
      return Object.entries(counts).map(([platform, count]): PlatformDist => ({
        platform,
        count,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** 指标趋势数据 */
export interface MetricTrend {
  date: string;
  votes: number;
  comments: number;
}

export function useMetricsTrend() {
  return useQuery({
    queryKey: ['metrics-trend'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metrics_daily')
        .select('snapshot_date, votes, comments')
        .order('snapshot_date', { ascending: true });
      if (error) throw error;
      const grouped: Record<string, { votes: number; comments: number }> = {};
      (data ?? []).forEach((row) => {
        const d = row.snapshot_date;
        if (!grouped[d]) grouped[d] = { votes: 0, comments: 0 };
        grouped[d].votes += row.votes ?? 0;
        grouped[d].comments += row.comments ?? 0;
      });
      return Object.entries(grouped).map(([date, vals]): MetricTrend => ({
        date,
        ...vals,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Top 内容（按 AI 评分） */
export interface TopContent {
  content_id: string;
  title: string | null;
  platform: string;
  ai_score: number | null;
  publish_date: string | null;
}

export function useTopContents(limit: number = 10) {
  return useQuery({
    queryKey: ['top-contents', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('structural_labels')
        .select(`
          content_id,
          ai_score,
          contents!inner (
            title,
            platform,
            publish_date
          )
        `)
        .order('ai_score', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((row): TopContent => {
        const c = Array.isArray(row.contents) ? row.contents[0] : row.contents;
        return {
          content_id: row.content_id,
          title: c?.title ?? null,
          platform: c?.platform ?? 'zhihu',
          ai_score: row.ai_score !== null ? Number(row.ai_score) : null,
          publish_date: c?.publish_date ?? null,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** 账号对比数据 */
export interface AccountComparison {
  account_name: string;
  content_count: number;
  avg_ai_score: number;
}

export function useAccountComparison() {
  return useQuery({
    queryKey: ['account-comparison'],
    queryFn: async () => {
      const { data: accounts, error: accError } = await supabase
        .from('zhihu_accounts')
        .select('account_id, account_name');
      if (accError) throw accError;

      const result: AccountComparison[] = [];
      for (const acc of accounts ?? []) {
        const { data: contents, error: contError } = await supabase
          .from('contents')
          .select('content_id')
          .eq('account_id', acc.account_id);
        if (contError) continue;

        const contentIds = (contents ?? []).map((c) => c.content_id);
        let avgScore = 0;
        if (contentIds.length > 0) {
          const { data: labels } = await supabase
            .from('structural_labels')
            .select('ai_score')
            .in('content_id', contentIds);
          const scores = (labels ?? [])
            .map((l) => l.ai_score)
            .filter((s): s is number => s !== null && s !== undefined)
            .map(Number);
          avgScore = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;
        }
        result.push({
          account_name: acc.account_name ?? '未知',
          content_count: (contents ?? []).length,
          avg_ai_score: Math.round(avgScore * 100) / 100,
        });
      }
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });
}
