// ============================================================
// Dashboard 数据查询 Hooks
// 通过 Supabase 直连获取业务数据
// AI Agent 规则：所有数据查询必须通过此文件导出的 hooks
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

/**
 * 查询知乎账号总数
 */
export function useAccountsCount() {
  return useQuery({
    queryKey: ['accounts-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('zhihu_accounts')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新请求
  });
}

/**
 * 查询内容总数
 */
export function useContentsCount() {
  return useQuery({
    queryKey: ['contents-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contents')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 查询总点赞数（所有 metrics_daily 中 votes 的总和）
 */
export function useTotalVotes() {
  return useQuery({
    queryKey: ['total-votes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metrics_daily')
        .select('votes');
      if (error) throw error;
      const total = (data ?? []).reduce((sum, row) => sum + (row.votes ?? 0), 0);
      return total;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 查询平均 AI 分数（structural_labels 中 ai_score 的平均值）
 */
export function useAvgAiScore() {
  return useQuery({
    queryKey: ['avg-ai-score'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('structural_labels')
        .select('ai_score');
      if (error) throw error;
      const scores = (data ?? [])
        .map((row) => row.ai_score)
        .filter((s): s is number => s !== null && s !== undefined);
      if (scores.length === 0) return 0;
      const avg = scores.reduce((sum, s) => sum + Number(s), 0) / scores.length;
      return Math.round(avg * 100) / 100; // 保留两位小数
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 查询最近内容（含关联账号名称）
 */
export function useRecentContents(limit: number = 5) {
  return useQuery({
    queryKey: ['recent-contents', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select(`
          content_id,
          title,
          platform,
          publish_date,
          account_id
        `)
        .order('publish_date', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;

      // 获取所有涉及的 account_id
      const accountIds = [...new Set((data ?? []).map((c) => c.account_id).filter(Boolean))];

      // 批量查询账号名称
      const accountMap = new Map<string, string>();
      if (accountIds.length > 0) {
        const { data: accounts, error: accError } = await supabase
          .from('zhihu_accounts')
          .select('account_id, account_name')
          .in('account_id', accountIds);
        if (!accError && accounts) {
          accounts.forEach((a) => {
            accountMap.set(a.account_id, a.account_name ?? '未知');
          });
        }
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
