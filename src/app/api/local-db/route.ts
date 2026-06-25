import { NextRequest, NextResponse } from 'next/server';

import { getLocalDbUrlForDisplay, queryLocalDb } from '@/lib/local-db';
import { AnalyticsCache } from '@/lib/server/analyticsCache';
import { supabaseRest, supabaseRpc } from '@/lib/server/supabaseRest';

type Filter =
  | { op: 'eq'; column: string; value: string | number | boolean | null }
  | { op: 'in'; column: string; values: Array<string | number | boolean> }
  | { op: 'ilike'; column: string; value: string }
  | { op: 'gte' | 'lte' | 'gt' | 'lt'; column: string; value: string | number };

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
type LocalDbResult = {
  data: unknown;
  count: number | null;
  error: null | { message: string };
};

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
  ['zhihu_accounts', new Set(['account_id', 'account_name', 'zhihu_uid', 'profile_url', 'followers', 'total_answers', 'is_active', 'notes', 'created_at', 'updated_at'])],
  ['bilibili_accounts', new Set(['account_id', 'account_name', 'follower_count', 'video_count', 'created_at', 'updated_at'])],
  ['contents', new Set(['content_id', 'platform', 'account_id', 'content_type', 'title', 'url', 'publish_date', 'created_at', 'updated_at', 'text', 'content_url', 'question_id', 'cover_url', 'play_count', 'like_count', 'coin_count', 'favorite_count', 'share_count', 'danmaku_count'])],
  ['metrics_daily', new Set(['id', 'content_id', 'snapshot_date', 'votes', 'comments', 'created_at'])],
  ['structural_labels', new Set(['content_id', 'hook_type', 'narrative_mode', 'emotional_valence', 'dominant_arg_style', 'persona', 'segment_types', 'conclusion_type', 'has_conclusion', 'has_promotion', 'promotion_position', 'text_length', 'data_count', 'mentions_price', 'mentions_free', 'ai_score', 'topic_types', 'tool_families', 'raw_ai_output', 'created_at', 'updated_at'])],
  ['writing_rules', new Set(['rule_id', 'category', 'rule_text', 'evidence_level', 'shap_score', 'chi_square_p', 'is_active', 'sort_order'])],
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

function parseColumnsForRest(table: string, columns: string) {
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

  return selected.join(',');
}

function applyRestFilters(params: URLSearchParams, table: string, filters: Filter[] | undefined) {
  if (!filters?.length) return;

  const tableColumns = allowedColumns.get(table);
  if (!tableColumns) {
    throw new Error(`Unsupported table: ${table}`);
  }

  for (const filter of filters) {
    if (!tableColumns.has(filter.column)) {
      throw new Error(`Unsupported filter column ${filter.column} for ${table}`);
    }

    if (filter.op === 'eq') {
      params.append(filter.column, filter.value === null ? 'is.null' : `eq.${encodeRestValue(filter.value)}`);
    } else if (filter.op === 'in') {
      const values = filter.values.map(encodeRestValue).join(',');
      params.append(filter.column, `in.(${values})`);
    } else if (filter.op === 'ilike') {
      params.append(filter.column, `ilike.${filter.value}`);
    } else {
      params.append(filter.column, `${filter.op}.${encodeRestValue(filter.value)}`);
    }
  }
}

function buildRestOrder(table: string, order: QueryPayload['order']) {
  if (!order) return '';
  const tableColumns = allowedColumns.get(table);
  if (!tableColumns?.has(order.column)) {
    throw new Error(`Unsupported order column ${order.column} for ${table}`);
  }
  const direction = order.ascending === false ? 'desc' : 'asc';
  const nulls = order.nullsFirst ? '.nullsfirst' : direction === 'desc' ? '.nullslast' : '';
  return `${order.column}.${direction}${nulls}`;
}

function encodeRestValue(value: string | number | boolean) {
  return String(value).replace(/"/g, '\\"');
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

    if (filter.op === 'gte' || filter.op === 'lte' || filter.op === 'gt' || filter.op === 'lt') {
      const operator = {
        gte: '>=',
        lte: '<=',
        gt: '>',
        lt: '<',
      }[filter.op];
      values.push(filter.value);
      clauses.push(`${column} ${operator} $${values.length}`);
      continue;
    }

    if (filter.op === 'in') {
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

async function runTableQuery(payload: QueryPayload): Promise<LocalDbResult> {
  if (!allowedTables.has(payload.table)) {
    throw new Error(`Unsupported table: ${payload.table}`);
  }

  const params = new URLSearchParams();
  params.set('select', payload.columns.trim() === '*' ? '*' : parseColumnsForRest(payload.table, payload.columns));
  applyRestFilters(params, payload.table, payload.filters);
  if (payload.order) {
    params.set('order', buildRestOrder(payload.table, payload.order));
  }

  if (payload.head) {
    const headResult = await supabaseRest<null>(`${payload.table}?${params.toString()}`, {
      method: 'HEAD',
      headers: payload.count === 'exact' ? { Prefer: 'count=exact' } : undefined,
    });
    return {
      data: null,
      count: headResult.count,
      error: null,
    };
  }

  const headers: Record<string, string> = {};
  if (payload.count === 'exact') {
    headers.Prefer = 'count=exact';
  }
  if (payload.range) {
    headers.Range = `${payload.range.from}-${payload.range.to}`;
  } else if (payload.limit) {
    headers.Range = `0-${payload.limit - 1}`;
  }

  const result = await supabaseRest<Array<Record<string, unknown>>>(`${payload.table}?${params.toString()}`, {
    headers,
  });

  const rows = result.data;
  if (payload.single) {
    if (rows.length !== 1) {
      return {
        data: null,
        count: result.count ?? rows.length,
        error: { message: rows.length === 0 ? 'No rows found' : 'Multiple rows found' },
      };
    }
    return {
      data: rows[0],
      count: result.count ?? 1,
      error: null,
    };
  }

  if (payload.maybeSingle) {
    return {
      data: rows[0] ?? null,
      count: result.count ?? rows.length,
      error: null,
    };
  }

  return {
    data: rows,
    count: result.count,
    error: null,
  };
}

async function runRpc(payload: RpcPayload): Promise<LocalDbResult> {
  if (payload.fn === 'get_metrics_trend') {
    const data = await supabaseRpc(payload.fn);
    return { data, error: null, count: null };
  }

  if (payload.fn === 'get_account_comparison') {
    const data = await supabaseRpc(payload.fn);
    return { data, error: null, count: null };
  }

  if (payload.fn === 'get_trend_data') {
    const args = payload.args ?? {};
    const data = await supabaseRpc(payload.fn, {
      start_date: args.start_date,
      end_date: args.end_date,
      account_ids: args.account_ids ?? [],
    });
    return { data, error: null, count: null };
  }

  throw new Error(`Unsupported RPC function: ${payload.fn}`);
}

export async function GET() {
  try {
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
    const cacheKey = `data-query:${JSON.stringify(payload)}`;
    const cached = await AnalyticsCache.getOrSet(
      cacheKey,
      () => (payload.kind === 'query' ? runTableQuery(payload) : runRpc(payload)),
      undefined,
      30 * 60 * 1000,
    );
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400',
        'X-Cache-Layer': cached.cacheLayer,
      },
    });
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
