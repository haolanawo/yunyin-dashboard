// ============================================================
// TopContentsTable — 高分内容排行
// ============================================================

'use client';

import { AlertCircle, Star } from 'lucide-react';
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
        <div key={i} className="h-10 bg-gray-200 rounded" />
      ))}
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400 text-xs">--</span>;
  const color =
    score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500';
  return <span className={`text-xs font-semibold ${color}`}>{score.toFixed(1)}</span>;
}

export default function TopContentsTable() {
  const { data, isLoading, isError, error } = useTopContents(8);

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
    <div className="space-y-1">
      {data.map((item, i) => (
        <div
          key={item.content_id}
          className="flex items-center gap-3 py-2 px-2 rounded hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-700 truncate block" title={item.title ?? undefined}>
              {item.title ?? '无标题'}
            </span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
              PLATFORM_COLORS[item.platform] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {PLATFORM_LABELS[item.platform] ?? item.platform}
          </span>
          <ScoreBadge score={item.ai_score} />
        </div>
      ))}
    </div>
  );
}
