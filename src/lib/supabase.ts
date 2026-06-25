const DATA_ROUTE = '/api/local-db';

type Filter =
  | { op: 'eq'; column: string; value: string | number | boolean | null }
  | { op: 'in'; column: string; values: Array<string | number | boolean> }
  | { op: 'ilike'; column: string; value: string }
  | { op: 'gte' | 'lte' | 'gt' | 'lt'; column: string; value: string | number };

interface QueryState {
  table: string;
  columns: string;
  count?: 'exact' | null;
  head?: boolean;
  filters: Filter[];
  order?: { column: string; ascending?: boolean; nullsFirst?: boolean };
  limit?: number;
  range?: { from: number; to: number };
}

async function callLocalDb(payload: Record<string, unknown>) {
  const response = await fetch(DATA_ROUTE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Local database request failed.');
  }
  return json;
}

class LocalQueryBuilder {
  constructor(private readonly state: QueryState) {}

  eq(column: string, value: string | number | boolean | null): any {
    return new LocalQueryBuilder({
      ...this.state,
      filters: [...this.state.filters, { op: 'eq', column, value }],
    });
  }

  in(column: string, values: Array<string | number | boolean>): any {
    return new LocalQueryBuilder({
      ...this.state,
      filters: [...this.state.filters, { op: 'in', column, values }],
    });
  }

  ilike(column: string, value: string): any {
    return new LocalQueryBuilder({
      ...this.state,
      filters: [...this.state.filters, { op: 'ilike', column, value }],
    });
  }

  gte(column: string, value: string | number): any {
    return new LocalQueryBuilder({
      ...this.state,
      filters: [...this.state.filters, { op: 'gte', column, value }],
    });
  }

  lte(column: string, value: string | number): any {
    return new LocalQueryBuilder({
      ...this.state,
      filters: [...this.state.filters, { op: 'lte', column, value }],
    });
  }

  gt(column: string, value: string | number): any {
    return new LocalQueryBuilder({
      ...this.state,
      filters: [...this.state.filters, { op: 'gt', column, value }],
    });
  }

  lt(column: string, value: string | number): any {
    return new LocalQueryBuilder({
      ...this.state,
      filters: [...this.state.filters, { op: 'lt', column, value }],
    });
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): any {
    return new LocalQueryBuilder({
      ...this.state,
      order: { column, ...options },
    });
  }

  limit(limit: number): any {
    return new LocalQueryBuilder({
      ...this.state,
      limit,
    });
  }

  range(from: number, to: number): any {
    return new LocalQueryBuilder({
      ...this.state,
      range: { from, to },
    });
  }

  single(): Promise<any> {
    return this.execute({ single: true });
  }

  maybeSingle(): Promise<any> {
    return this.execute({ maybeSingle: true });
  }

  then(onfulfilled?: ((value: any) => any) | null, onrejected?: ((reason: unknown) => any) | null): Promise<any> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(flags?: { single?: boolean; maybeSingle?: boolean }): Promise<any> {
    return callLocalDb({
      kind: 'query',
      ...this.state,
      ...flags,
    });
  }
}

class LocalAwareClient {
  from(table: string): any {
    return {
      select: (columns: string, options?: { count?: 'exact' | null; head?: boolean }) =>
        new LocalQueryBuilder({
          table,
          columns,
          count: options?.count,
          head: options?.head,
          filters: [],
        }),
    };
  }

  async rpc(fn: 'get_metrics_trend' | 'get_account_comparison' | 'get_trend_data', args?: Record<string, unknown>): Promise<any> {
    return callLocalDb({
      kind: 'rpc',
      fn,
      args,
    });
  }
}

export function createClient(): any {
  return new LocalAwareClient();
}

export type { Database } from './database.types';
