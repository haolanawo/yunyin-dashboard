'use client';

import Link from 'next/link';
import { AlertCircle, Star, ThumbsUp } from 'lucide-react';
import { useTopContents } from '@/features/analytics/hooks/useAnalytics';

const PLATFORM_LABELS: Record<string, string> = { zhihu: '知乎', bilibili: 'B站' };
const PLATFORM_COLORS: Record<string, string> = {
  zhihu: 'bg-blue-100 text-blue-700',
  bilibili: 'bg-pink-100 text-pink-700',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 rounded bg-gray-200" />
      ))}
    </div>
  );
}

function formatVotes(value: number): string {
  const n = Number(value ?? 0);
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function displayTitle(title: string | null, contentId: string): string {
  const normalized = title?.trim();
  return normalized || `未命名内容 ${contentId}`;
}

export default function TopContentsTable() {
  const { data: payload, isLoading, isError, error } = useTopContents(10);
  const data = payload?.data;

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
        <AlertCircle size={20} className="text-red-400" />
        <p className="text-sm">数据加载失败</p>
        <p className="text-xs">{error?.message ?? '未知错误'}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <p className="text-sm">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {data.map((item, index) => {
        const title = displayTitle(item.title, item.content_id);
        return (
          <Link
            key={item.content_id}
            href={`/content/${item.content_id}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
          >
            <div className="w-6 shrink-0 text-center">
              {index < 3 ? (
                <Star
                  size={14}
                  className={
                    index === 0
                      ? 'fill-yellow-500 text-yellow-500'
                      : index === 1
                        ? 'fill-gray-400 text-gray-400'
                        : 'fill-orange-400 text-orange-400'
                  }
                />
              ) : (
                <span className="text-xs text-gray-400">{index + 1}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm text-gray-700 transition-colors hover:text-brand-600" title={title}>
                {title}
              </span>
            </div>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                PLATFORM_COLORS[item.platform] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {PLATFORM_LABELS[item.platform] ?? item.platform}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-orange-600">
              <ThumbsUp size={12} />
              {formatVotes(item.votes)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
