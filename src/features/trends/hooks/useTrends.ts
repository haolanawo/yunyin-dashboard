// ============================================================
// Trends Hooks
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export interface AccountTrend {
  account_name: string;
  account_id: string;
  date: string;
  votes: number;
  comments: number;
}

export interface AccountOption {
  account_id: string;
  account_name: string;
}

/** 获取所有账号列表（用于选择器） */
export function useAccountList() {
  return useQuery({
    queryKey: ['account-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zhihu_accounts')
        .select('account_id, account_name')
        .order('account_name', { ascending: true });
      if (error) throw error;
      return (data ?? []).filter((a) => a.account_id).map(
        (a): AccountOption => ({ account_id: a.account_id, account_name: a.account_name ?? '未知' }),
      );
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

/** 按日期范围获取指定账号的指标趋势 */
export function useAccountTrends(
  accountIds: string[],
  dateRange: { start: string; end: string },
) {
  const enabled = accountIds.length > 0 && !!dateRange.start && !!dateRange.end;

  return useQuery({
    queryKey: ['account-trends', accountIds, dateRange],
    queryFn: async () => {
      if (accountIds.length === 0) return [] as AccountTrend[];

      // 服务端聚合查询：数据库内完成 GROUP BY，返回已汇总结果
      // 避免客户端 1000 行硬限制，也省掉 JS 侧聚合计算
      const { data, error } = await supabase.rpc('get_trend_data', {
        start_date: dateRange.start,
        end_date: dateRange.end,
        account_ids: accountIds,
      });

      if (error) throw error;
      if (!data || data.length === 0) return [] as AccountTrend[];

      return (data as any[]).map((row) => ({
        account_name: row.account_name ?? '未知',
        account_id: row.account_id,
        date: row.snapshot_date,
        votes: Number(row.total_votes ?? 0),
        comments: Number(row.total_comments ?? 0),
      }));
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled,
  });
}
