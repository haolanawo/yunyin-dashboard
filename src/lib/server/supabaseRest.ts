import 'server-only';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function requireSupabaseRest() {
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL.');
  }
  if (!supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
}

export async function supabaseRest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'HEAD';
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<{ data: T; count: number | null }> {
  requireSupabaseRest();
  const method = options.method ?? 'GET';
  const response = await fetch(`${supabaseUrl!.replace(/\/$/, '')}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: supabaseKey!,
      Authorization: `Bearer ${supabaseKey}`,
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase REST ${method} ${path} failed: ${response.status} ${text}`);
  }

  const count = parseContentRange(response.headers.get('content-range'));
  if (method === 'HEAD') {
    return { data: null as T, count };
  }

  const text = await response.text();
  return { data: (text ? JSON.parse(text) : null) as T, count };
}

export async function supabaseRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const result = await supabaseRest<T>(`rpc/${fn}`, {
    method: 'POST',
    body: args ?? {},
  });
  return result.data;
}

function parseContentRange(value: string | null) {
  if (!value) return null;
  const total = value.split('/')[1];
  if (!total || total === '*') return null;
  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : null;
}
