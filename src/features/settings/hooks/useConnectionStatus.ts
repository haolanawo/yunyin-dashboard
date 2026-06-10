// ============================================================
// Settings Hooks
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export interface ConnectionStatus {
  connected: boolean;
  latency: number | null;
  error: string | null;
  projectUrl: string;
}

export function useSupabaseStatus() {
  return useQuery({
    queryKey: ['supabase-status'],
    queryFn: async () => {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '未配置';
      const start = Date.now();
      try {
        const { error } = await supabase
          .from('zhihu_accounts')
          .select('count', { count: 'exact', head: true });
        const latency = Date.now() - start;
        if (error) {
          return { connected: false, latency: null, error: error.message, projectUrl };
        }
        return { connected: true, latency, error: null, projectUrl };
      } catch (e) {
        return {
          connected: false,
          latency: null,
          error: e instanceof Error ? e.message : '连接失败',
          projectUrl,
        };
      }
    },
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export interface TableInfo {
  name: string;
  count: number;
}

export function useTableCounts() {
  return useQuery({
    queryKey: ['table-counts'],
    queryFn: async () => {
      const tables = ['zhihu_accounts', 'contents', 'metrics_daily', 'structural_labels', 'writing_rules'];
      const results: TableInfo[] = [];
      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        results.push({ name: table, count: error ? 0 : (count ?? 0) });
      }
      return results;
    },
    staleTime: 60 * 1000,
  });
}
