import 'server-only';

import { Pool, type QueryResultRow } from 'pg';

const databaseUrl =
  process.env.SUPABASE_DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  '';

function assertRemoteDatabaseUrl(url: string) {
  if (!url) {
    throw new Error('Missing SUPABASE_DATABASE_URL or POSTGRES_URL for Supabase Postgres access.');
  }

  if (!process.env.ALLOW_LOCAL_DATABASE && /localhost|127\.0\.0\.1|content-analysis-postgres/i.test(url)) {
    throw new Error('Local PostgreSQL access is disabled. Set SUPABASE_DATABASE_URL to the Supabase pooled connection string.');
  }
}

let pool: Pool | null = null;

function getSslConfig() {
  if (/supabase\.com/i.test(databaseUrl)) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

function getPoolConnectionString() {
  if (!/supabase\.com/i.test(databaseUrl)) {
    return databaseUrl;
  }

  const url = new URL(databaseUrl);
  url.searchParams.delete('sslmode');
  return url.toString();
}

export function getLocalDbPool() {
  assertRemoteDatabaseUrl(databaseUrl);
  if (!pool) {
    pool = new Pool({
      connectionString: getPoolConnectionString(),
      max: 4,
      ssl: getSslConfig(),
    });
  }

  return pool;
}

export async function queryLocalDb<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
  return getLocalDbPool().query<T>(sql, params);
}

export function getLocalDbUrlForDisplay() {
  if (process.env.ENABLE_DIRECT_SQL !== '1') {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'Supabase'}/rest/v1`;
  }
  if (!databaseUrl) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'Supabase REST';
  }
  return databaseUrl.replace(/:\/\/([^:@]+):([^@]+)@/, '://$1:***@');
}
