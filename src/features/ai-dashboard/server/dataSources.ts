import 'server-only';

import type { AiDataSource, TableSchema } from '@/features/ai-dashboard/types';
import { TABLE_CATALOG } from './tableCatalog';

const STATIC_SCHEMAS: Record<string, TableSchema['columns']> = {
  zhihu_accounts: [
    { name: 'account_id', dataType: 'text', isNullable: false },
    { name: 'account_name', dataType: 'text', isNullable: true },
    { name: 'zhihu_uid', dataType: 'text', isNullable: true },
    { name: 'followers', dataType: 'integer', isNullable: true },
  ],
  bilibili_accounts: [
    { name: 'account_id', dataType: 'text', isNullable: false },
    { name: 'account_name', dataType: 'text', isNullable: true },
    { name: 'follower_count', dataType: 'integer', isNullable: true },
  ],
  contents: [
    { name: 'content_id', dataType: 'text', isNullable: false },
    { name: 'platform', dataType: 'text', isNullable: false },
    { name: 'account_id', dataType: 'text', isNullable: true },
    { name: 'content_type', dataType: 'text', isNullable: true },
    { name: 'title', dataType: 'text', isNullable: true },
    { name: 'text', dataType: 'text', isNullable: true },
    { name: 'publish_date', dataType: 'date', isNullable: true },
    { name: 'play_count', dataType: 'integer', isNullable: true },
    { name: 'like_count', dataType: 'integer', isNullable: true },
  ],
  metrics_daily: [
    { name: 'content_id', dataType: 'text', isNullable: false },
    { name: 'snapshot_date', dataType: 'date', isNullable: false },
    { name: 'votes', dataType: 'integer', isNullable: true },
    { name: 'comments', dataType: 'integer', isNullable: true },
  ],
  structural_labels: [
    { name: 'content_id', dataType: 'text', isNullable: false },
    { name: 'hook_type', dataType: 'text', isNullable: true },
    { name: 'narrative_mode', dataType: 'text', isNullable: true },
    { name: 'ai_score', dataType: 'numeric', isNullable: true },
  ],
  writing_rules: [
    { name: 'rule_id', dataType: 'integer', isNullable: false },
    { name: 'category', dataType: 'text', isNullable: false },
    { name: 'rule_text', dataType: 'text', isNullable: false },
  ],
  content_metric_snapshots: [
    { name: 'content_id', dataType: 'text', isNullable: false },
    { name: 'platform', dataType: 'text', isNullable: false },
    { name: 'snapshot_date', dataType: 'date', isNullable: false },
    { name: 'views', dataType: 'bigint', isNullable: true },
    { name: 'likes', dataType: 'bigint', isNullable: true },
    { name: 'comments', dataType: 'bigint', isNullable: true },
  ],
  crawler_runs: [
    { name: 'run_id', dataType: 'uuid', isNullable: false },
    { name: 'platform', dataType: 'text', isNullable: false },
    { name: 'status', dataType: 'text', isNullable: false },
    { name: 'started_at', dataType: 'timestamptz', isNullable: false },
  ],
};

export async function listAiDataSources(): Promise<AiDataSource[]> {
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasDirectSql = process.env.ENABLE_DIRECT_SQL === '1';

  return [
    {
      id: 'supabase',
      label: 'Supabase',
      description: hasDirectSql
        ? '查询 Supabase 远端 PostgreSQL，服务端三级缓存保护流量'
        : '常规看板可用；AI 动态 SQL 需要 ENABLE_DIRECT_SQL=1',
      available: hasSupabase && hasDirectSql,
      queryBackend: 'supabase',
    },
  ];
}

export async function listTableSchemasForSource(_dataSourceId: AiDataSource['id']) {
  return TABLE_CATALOG.map((table) => ({ name: table, columns: STATIC_SCHEMAS[table] ?? [] }));
}
