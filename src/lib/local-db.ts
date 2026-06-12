import 'server-only';

import { Pool, type QueryResultRow } from 'pg';

const DEFAULT_LOCAL_DB_URL = 'postgresql://content:content@localhost:5432/content_analysis';
const databaseUrl = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || DEFAULT_LOCAL_DB_URL;

let pool: Pool | null = null;

export function getLocalDbPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      max: 4,
    });
  }

  return pool;
}

export async function queryLocalDb<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
  return getLocalDbPool().query<T>(sql, params);
}

export function getLocalDbUrlForDisplay() {
  return databaseUrl;
}
