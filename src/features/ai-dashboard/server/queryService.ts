import 'server-only';

import { queryLocalDb } from '@/lib/local-db';
import { AnalyticsCache } from '@/lib/server/analyticsCache';
import type { AiDataSource, QueryResultRow } from '@/features/ai-dashboard/types';
import { validateReadonlySql } from './sqlSafety';

export async function executeAiDashboardQuery(
  dataSourceId: AiDataSource['id'],
  sql: string,
): Promise<QueryResultRow[]> {
  validateReadonlySql(sql);

  if (dataSourceId !== 'supabase') {
    throw new Error(`Unsupported data source: ${dataSourceId}`);
  }

  if (process.env.ENABLE_DIRECT_SQL !== '1') {
    throw new Error('AI dynamic SQL is disabled on Vercel because Supabase direct Postgres DNS is unavailable. Use fixed dashboard APIs/RPCs for production data.');
  }

  const cached = await AnalyticsCache.getOrSet(
    `ai-dashboard:sql:${sql}`,
    async () => {
      const result = await queryLocalDb(sql);
      return result.rows as QueryResultRow[];
    },
    'dynamic-sql',
    30 * 60 * 1000,
  );

  return cached.data;
}
