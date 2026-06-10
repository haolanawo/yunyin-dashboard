// ============================================================
// Supabase Client — 唯一入口
// AI Agent 规则：所有 Supabase 交互必须通过此文件导出的 client
// 禁止在 feature 中直接 new createClient()
// ============================================================

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * 类型导出 — 当数据库 schema 变更时，运行：
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 * 然后替换下面的 any 为生成的 Database 类型
 */
export type { Database } from './database.types';
