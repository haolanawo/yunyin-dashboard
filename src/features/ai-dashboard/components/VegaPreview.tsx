'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { QueryResultRow } from '@/features/ai-dashboard/types';

declare global {
  interface Window {
    vegaEmbed?: (
      element: HTMLElement,
      spec: unknown,
      options?: Record<string, unknown>,
    ) => Promise<{ finalize?: () => void }>;
  }
}

const VEGA_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/vega@5',
  'https://cdn.jsdelivr.net/npm/vega-lite@5',
  'https://cdn.jsdelivr.net/npm/vega-embed@6',
];

let scriptsPromise: Promise<void> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-vega-src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.vegaSrc = src;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureVegaScripts() {
  if (!scriptsPromise) {
    scriptsPromise = VEGA_SCRIPTS.reduce(
      (promise, src) => promise.then(() => loadScript(src)),
      Promise.resolve(),
    );
  }
  return scriptsPromise;
}

export function VegaPreview({
  spec,
  data,
  height = 320,
}: {
  spec: Record<string, unknown>;
  data: QueryResultRow[];
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const mergedSpec = useMemo(
    () => ({
      ...spec,
      data: { values: data },
      height,
    }),
    [spec, data, height],
  );

  useEffect(() => {
    let finalized: (() => void) | undefined;
    let disposed = false;

    async function render() {
      if (!containerRef.current) return;
      try {
        setError(null);
        await ensureVegaScripts();
        if (!window.vegaEmbed) {
          throw new Error('vegaEmbed 未成功加载');
        }
        const result = await window.vegaEmbed(containerRef.current, mergedSpec, {
          actions: false,
          renderer: 'svg',
        });
        finalized = result.finalize;
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : '图表渲染失败');
        }
      }
    }

    render();

    return () => {
      disposed = true;
      finalized?.();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [mergedSpec]);

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  return <div ref={containerRef} className="min-h-[240px] w-full overflow-x-auto" />;
}
