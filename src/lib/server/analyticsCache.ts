import 'server-only';

import { createHash } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

interface CacheEntry<T> {
  data: T;
  generatedAt: string;
  sourceWindow?: string;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 30 * 60 * 1000;
const CACHE_DIR = path.join(process.cwd(), '.cache', 'api');

export interface CachedResponse<T> {
  data: T;
  cached: boolean;
  cacheLayer: 'memory' | 'disk' | 'miss';
  generatedAt: string;
  cacheKey: string;
  sourceWindow?: string;
}

function now() {
  return Date.now();
}

function cacheFilePath(key: string) {
  const hash = createHash('sha256').update(key).digest('hex');
  return path.join(CACHE_DIR, `${hash}.json`);
}

async function readDiskCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await readFile(cacheFilePath(key), 'utf8');
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry.expiresAt <= now()) {
      return null;
    }
    cacheStore.set(key, entry);
    return entry;
  } catch {
    return null;
  }
}

async function writeDiskCache<T>(key: string, entry: CacheEntry<T>) {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(cacheFilePath(key), JSON.stringify(entry), 'utf8');
  } catch {
    // Disk cache is a best-effort second layer. Memory cache still protects the request path.
  }
}

export const AnalyticsCache = {
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    sourceWindow?: string,
    ttlMs = DEFAULT_TTL_MS,
  ): Promise<CachedResponse<T>> {
    const existing = cacheStore.get(key) as CacheEntry<T> | undefined;
    if (existing && existing.expiresAt > now()) {
      return {
        data: existing.data,
        cached: true,
        cacheLayer: 'memory',
        generatedAt: existing.generatedAt,
        cacheKey: key,
        sourceWindow: existing.sourceWindow,
      };
    }

    const diskEntry = await readDiskCache<T>(key);
    if (diskEntry) {
      return {
        data: diskEntry.data,
        cached: true,
        cacheLayer: 'disk',
        generatedAt: diskEntry.generatedAt,
        cacheKey: key,
        sourceWindow: diskEntry.sourceWindow,
      };
    }

    const data = await loader();
    const generatedAt = new Date().toISOString();
    const entry: CacheEntry<T> = {
      data,
      generatedAt,
      sourceWindow,
      expiresAt: now() + ttlMs,
    };
    cacheStore.set(key, entry);
    await writeDiskCache(key, entry);

    return {
      data,
      cached: false,
      cacheLayer: 'miss',
      generatedAt,
      cacheKey: key,
      sourceWindow,
    };
  },

  invalidate(prefix?: string) {
    if (!prefix) {
      cacheStore.clear();
      return;
    }

    for (const key of cacheStore.keys()) {
      if (key.startsWith(prefix)) {
        cacheStore.delete(key);
      }
    }
  },
};
