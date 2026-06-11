// ============================================================
// 高分内容排行（按赞同数排序，可点击到详情）
// ============================================================

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
        <div key={i} className="h-12 bg-gray-200 rounded" />
      ))}
    </div>
  );
}

function formatVotes(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function TopContentsTable() {
  const { data, isLoading, isError, error } = useTopContents(10);

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
        <AlertCircle size={20} className="text-red-400" />
        <p className="text-sm">数据加载失败</p>
        <p className="text-xs">{error?.message}</p>
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
      {data.map((item, i) => (
        <Link
          key={item.content_id}
          href={`/content/${item.content_id}`}
          className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div className="w-6 text-center shrink-0">
            {i < 3 ? (
              <Star size={14} className={i === 0 ? 'text-yellow-500 fill-yellow-500' : i === 1 ? 'text-gray-400 fill-gray-400' : 'text-orange-400 fill-orange-400'} />
            ) : (
              <span className="text-xs text-gray-400">{i + 1}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-700 group-hover:text-brand-600 truncate block transition-colors" title={item.title ?? undefined}>
              {item.title ?? '无标题'}
            </span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${PLATFORM_COLORS[item.platform] ?? 'bg-gray-100 text-gray-600'}`}>
            {PLATFORM_LABELS[item.platform] ?? item.platform}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 shrink-0">
            <ThumbsUp size={12} />
            {formatVotes(item.votes)}
          </span>
        </Link>
      ))}
    </div>
  );
}
