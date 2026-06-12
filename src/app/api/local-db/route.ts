import { NextRequest, NextResponse } from 'next/server';

import { getLocalDbUrlForDisplay, queryLocalDb } from '@/lib/local-db';

type Filter =
  | { op: 'eq'; column: string; value: string | number | boolean | null }
  | { op: 'in'; column: string; values: Array<string | number | boolean> }
  | { op: 'ilike'; column: string; value: string };

interface QueryPayload {
  kind: 'query';
  table: string;
  columns: string;
  filters?: Filter[];
  order?: { column: string; ascending?: boolean; nullsFirst?: boolean };
  limit?: number;
  range?: { from: number; to: number };
  count?: 'exact' | null;
  head?: boolean;
  single?: boolean;
  maybeSingle?: boolean;
}

interface RpcPayload {
  kind: 'rpc';
  fn: 'get_metrics_trend' | 'get_account_comparison' | 'get_trend_data';
  args?: Record<string, unknown>;
}

type LocalDbPayload = QueryPayload | RpcPayload;

const allowedTables = new Set([
  'zhihu_accounts',
  'bilibili_accounts',
  'contents',
  'metrics_daily',
  'structural_labels',
  'writing_rules',
  'content_metric_snapshots',
  'crawler_runs',
]);

const allowedColumns = new Map<string, Set<string>>([
  ['zhihu_accounts', new Set(['account_id', 'account_name', 'avatar_url', 'headline', 'updated_at'])],
  ['bilibili_accounts', new Set(['account_id', 'account_name', 'avatar_url', 'follower_count', 'updated_at'])],
  ['contents', new Set(['content_id', 'platform', 'account_id', 'account_name', 'owner', 'publish_date', 'title', 'url', 'content_type', 'content_url', 'cover_url', 'play_count', 'like_count', 'coin_count', 'favorite_count', 'share_count', 'danmaku_count', 'reply_count', 'question_id', 'updated_at'])],
  ['metrics_daily', new Set(['content_id', 'snapshot_date', 'votes', 'comments', 'views', 'likes', 'favorites', 'shares', 'new_followers', 'raw'])],
  ['structural_labels', new Set(['content_id', 'content_type', 'topic_type', 'structure_hook', 'structure_body', 'structure_cta', 'narrative_style', 'ai_score', 'updated_at'])],
  ['writing_rules', new Set(['rule_id', 'category', 'rule_text', 'evidence_level', 'shap_score', 'chi_square_p', 'is_active', 'sort_order', 'created_at', 'updated_at'])],
  ['content_metric_snapshots', new Set(['content_id', 'platform', 'snapshot_date', 'views', 'likes', 'favorites', 'coins', 'shares', 'comments', 'danmaku', 'raw', 'created_at'])],
  ['crawler_runs', new Set(['run_id', 'platform', 'status', 'started_at', 'finished_at', 'items_found', 'items_upserted', 'error_message', 'raw'])],
]);

function quoteIdentifier(identifier: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

function parseColumns(table: string, columns: string) {
  if (columns.trim() === '*') {
    return '*';
  }

  const tableColumns = allowedColumns.get(table);
  if (!tableColumns) {
    throw new Error(`Unsupported table: ${table}`);
  }

  const selected = columns
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean);

  if (selected.length === 0) {
    throw new Error('At least one column is required.');
  }

  for (const column of selected) {
    if (!tableColumns.has(column)) {
      throw new Error(`Unsupported column ${column} for ${table}`);
    }
  }

  return selected.map(quoteIdentifier).join(', ');
}

function buildWhere(table: string, filters: Filter[] | undefined, values: unknown[]) {
  if (!filters || filters.length === 0) {
    return '';
  }

  const tableColumns = allowedColumns.get(table);
  if (!tableColumns) {
    throw new Error(`Unsupported table: ${table}`);
  }

  const clauses: string[] = [];
  for (const filter of filters) {
    if (!tableColumns.has(filter.column)) {
      throw new Error(`Unsupported filter column ${filter.column} for ${table}`);
    }

    const column = quoteIdentifier(filter.column);
    if (filter.op === 'eq') {
      if (filter.value === null) {
        clauses.push(`${column} is null`);
      } else {
        values.push(filter.value);
        clauses.push(`${column} = $${values.length}`);
      }
      continue;
    }

    if (filter.op === 'ilike') {
      values.push(filter.value);
      clauses.push(`${column} ilike $${values.length}`);
      continue;
    }

    if (!filter.values.length) {
      clauses.push('1 = 0');
      continue;
    }

    const placeholders = filter.values.map((value) => {
      values.push(value);
      return `$${values.length}`;
    });
    clauses.push(`${column} in (${placeholders.join(', ')})`);
  }

  return clauses.length ? ` where ${clauses.join(' and ')}` : '';
}

function buildOrder(table: string, order: QueryPayload['order']) {
  if (!order) {
    return '';
  }

  const tableColumns = allowedColumns.get(table);
  if (!tableColumns?.has(order.column)) {
    throw new Error(`Unsupported order column ${order?.column} for ${table}`);
  }

  const direction = order.ascending === false ? 'desc' : 'asc';
  const nulls = order.nullsFirst ? ' nulls first' : direction === 'desc' ? ' nulls last' : '';
  return ` order by ${quoteIdentifier(order.column)} ${direction}${nulls}`;
}

async function runTableQuery(payload: QueryPayload) {
  if (!allowedTables.has(payload.table)) {
    throw new Error(`Unsupported table: ${payload.table}`);
  }

  const values: unknown[] = [];
  const whereClause = buildWhere(payload.table, payload.filters, values);
  const orderClause = buildOrder(payload.table, payload.order);

  const countResult =
    payload.count === 'exact'
      ? await queryLocalDb<{ total: string }>(`select count(*)::text as total from public.${payload.table}${whereClause}`, values)
      : null;

  if (payload.head) {
    return {
      data: null,
      count: countResult ? Number(countResult.rows[0]?.total ?? 0) : null,
      error: null,
    };
  }

  const selectColumns = parseColumns(payload.table, payload.columns);
  const limitClause =
    payload.range
      ? ` limit ${Math.max(payload.range.to - payload.range.from + 1, 0)} offset ${payload.range.from}`
      : payload.limit
        ? ` limit ${payload.limit}`
        : '';

  const sql = `select ${selectColumns} from public.${payload.table}${whereClause}${orderClause}${limitClause}`;
  const result = await queryLocalDb(sql, values);

  const rows = result.rows as Array<Record<string, unknown>>;
  if (payload.single) {
    if (rows.length !== 1) {
      return {
        data: null,
        count: countResult ? Number(countResult.rows[0]?.total ?? rows.length) : rows.length,
        error: { message: rows.length === 0 ? 'No rows found' : 'Multiple rows found' },
      };
    }
    return {
      data: rows[0],
      count: countResult ? Number(countResult.rows[0]?.total ?? 1) : 1,
      error: null,
    };
  }

  if (payload.maybeSingle) {
    return {
      data: rows[0] ?? null,
      count: countResult ? Number(countResult.rows[0]?.total ?? rows.length) : rows.length,
      error: null,
    };
  }

  return {
    data: rows,
    count: countResult ? Number(countResult.rows[0]?.total ?? rows.length) : null,
    error: null,
  };
}

async function runRpc(payload: RpcPayload) {
  if (payload.fn === 'get_metrics_trend') {
    const result = await queryLocalDb('select * from public.get_metrics_trend()');
    return { data: result.rows, error: null, count: null };
  }

  if (payload.fn === 'get_account_comparison') {
    const result = await queryLocalDb('select * from public.get_account_comparison()');
    return { data: result.rows, error: null, count: null };
  }

  if (payload.fn === 'get_trend_data') {
    const args = payload.args ?? {};
    const result = await queryLocalDb(
      'select * from public.get_trend_data($1::date, $2::date, $3::text[])',
      [args.start_date, args.end_date, args.account_ids ?? []],
    );
    return { data: result.rows, error: null, count: null };
  }

  throw new Error(`Unsupported RPC function: ${payload.fn}`);
}

export async function GET() {
  try {
    await queryLocalDb('select 1');
    return NextResponse.json({
      ok: true,
      databaseUrl: getLocalDbUrlForDisplay(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Local database unavailable.',
      },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as LocalDbPayload;
    const result = payload.kind === 'query' ? await runTableQuery(payload) : await runRpc(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        count: null,
        error: {
          message: error instanceof Error ? error.message : 'Local database request failed.',
        },
      },
      { status: 500 },
    );
  }
}
