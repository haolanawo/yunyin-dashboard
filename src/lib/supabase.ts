import { createBrowserClient } from '@supabase/ssr';

const LOCAL_ROUTE = '/api/local-db';
const DATA_SOURCE_MODE = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'auto';

type Filter =
  | { op: 'eq'; column: string; value: string | number | boolean | null }
  | { op: 'in'; column: string; values: Array<string | number | boolean> }
  | { op: 'ilike'; column: string; value: string };

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

function createSupabaseFallbackClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function callLocalDb(payload: Record<string, unknown>) {
  const response = await fetch(LOCAL_ROUTE, {
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

async function canUseLocalDb() {
  try {
    const response = await fetch(LOCAL_ROUTE, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

class LocalQueryBuilder {
  constructor(
    private readonly fallbackClient: any,
    private readonly state: QueryState,
  ) {}

  eq(column: string, value: string | number | boolean | null): any {
    return new LocalQueryBuilder(this.fallbackClient, {
      ...this.state,
      filters: [...this.state.filters, { op: 'eq', column, value }],
    });
  }

  in(column: string, values: Array<string | number | boolean>): any {
    return new LocalQueryBuilder(this.fallbackClient, {
      ...this.state,
      filters: [...this.state.filters, { op: 'in', column, values }],
    });
  }

  ilike(column: string, value: string): any {
    return new LocalQueryBuilder(this.fallbackClient, {
      ...this.state,
      filters: [...this.state.filters, { op: 'ilike', column, value }],
    });
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): any {
    return new LocalQueryBuilder(this.fallbackClient, {
      ...this.state,
      order: { column, ...options },
    });
  }

  limit(limit: number): any {
    return new LocalQueryBuilder(this.fallbackClient, {
      ...this.state,
      limit,
    });
  }

  range(from: number, to: number): any {
    return new LocalQueryBuilder(this.fallbackClient, {
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
    const mode = DATA_SOURCE_MODE;
    const tryLocal = mode === 'local' || mode === 'auto';

    if (tryLocal && await canUseLocalDb()) {
      try {
        return await callLocalDb({
          kind: 'query',
          ...this.state,
          ...flags,
        });
      } catch (error) {
        if (mode === 'local') {
          throw error;
        }
      }
    }

    let query = this.fallbackClient.from(this.state.table).select(this.state.columns, {
      count: this.state.count,
      head: this.state.head,
    });

    for (const filter of this.state.filters) {
      if (filter.op === 'eq') {
        query = query.eq(filter.column, filter.value);
      } else if (filter.op === 'in') {
        query = query.in(filter.column, filter.values);
      } else {
        query = query.ilike(filter.column, filter.value);
      }
    }

    if (this.state.order) {
      query = query.order(this.state.order.column, {
        ascending: this.state.order.ascending,
        nullsFirst: this.state.order.nullsFirst,
      });
    }

    if (this.state.limit !== undefined) {
      query = query.limit(this.state.limit);
    }

    if (this.state.range) {
      query = query.range(this.state.range.from, this.state.range.to);
    }

    if (flags?.single) {
      return query.single();
    }

    if (flags?.maybeSingle) {
      return query.maybeSingle();
    }

    return query;
  }
}

class LocalAwareClient {
  private readonly fallbackClient = createSupabaseFallbackClient();

  from(table: string): any {
    return {
      select: (columns: string, options?: { count?: 'exact' | null; head?: boolean }) =>
        new LocalQueryBuilder(this.fallbackClient, {
          table,
          columns,
          count: options?.count,
          head: options?.head,
          filters: [],
        }),
    };
  }

  async rpc(fn: 'get_metrics_trend' | 'get_account_comparison' | 'get_trend_data', args?: Record<string, unknown>): Promise<any> {
    const mode = DATA_SOURCE_MODE;
    const tryLocal = mode === 'local' || mode === 'auto';

    if (tryLocal && await canUseLocalDb()) {
      try {
        return await callLocalDb({
          kind: 'rpc',
          fn,
          args,
        });
      } catch (error) {
        if (mode === 'local') {
          throw error;
        }
      }
    }

    return this.fallbackClient.rpc(fn, args);
  }
}

export function createClient(): any {
  return new LocalAwareClient();
}

export type { Database } from './database.types';
