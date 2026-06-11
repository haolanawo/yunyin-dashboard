// ============================================================
// ContentTable — 内容列表表格
// ============================================================

'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, ExternalLink, FileText } from 'lucide-react';
import type { ContentItem } from '@/features/content-ranking/hooks/useContents';

const PLATFORM_LABELS: Record<string, string> = { zhihu: '知乎', bilibili: 'B站' };
const PLATFORM_COLORS: Record<string, string> = {
  zhihu: 'bg-blue-100 text-blue-700',
  bilibili: 'bg-pink-100 text-pink-700',
};
const TYPE_LABELS: Record<string, string> = { answer: '回答', article: '文章', video: '视频' };

function formatDate(d: string | null): string {
  if (!d) return '--';
  return d;
}

function getDisplayTitle(item: ContentItem): string {
  if (item.title) return item.title;
  if (item.content_type === 'answer' && item.question_id) return `知乎问题 #${item.question_id}`;
  return item.content_type === 'answer' ? '知乎回答' : '无标题';
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400 text-xs">--</span>;
  const color =
    score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500';
  return <span className={`text-xs font-semibold ${color}`}>{score.toFixed(1)}</span>;
}

function LoadingSkeleton() {
  const titleWidths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-3/5'];
  const accountWidths = ['w-20', 'w-16', 'w-14', 'w-18', 'w-16'];
  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="flex items-center gap-4 px-2 py-3 border-b border-gray-100">
        <div className="flex-1" />
        <div className="w-16" />
        <div className="w-24" />
        <div className="w-14" />
        <div className="w-24" />
        <div className="w-16" />
      </div>
      {/* Data rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-3 border-b border-gray-50">
          <div className="flex-1">
            <div className={`skeleton-shimmer h-4 rounded ${titleWidths[i - 1]}`} />
          </div>
          <div className="w-16 flex justify-center">
            <div className="skeleton-shimmer h-5 w-10 rounded" />
          </div>
          <div className="w-24">
            <div className={`skeleton-shimmer h-4 rounded ${accountWidths[i - 1]}`} />
          </div>
          <div className="w-14 flex justify-center">
            <div className="skeleton-shimmer h-4 w-8 rounded" />
          </div>
          <div className="w-24">
            <div className="skeleton-shimmer h-4 w-20 rounded" />
          </div>
          <div className="w-16 flex justify-end">
            <div className="skeleton-shimmer h-4 w-10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ContentTableProps {
  items: ContentItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export default function ContentTable({ items, isLoading, isError, error }: ContentTableProps) {
  const router = useRouter();

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
        <AlertCircle size={24} className="text-red-400" />
        <p className="text-sm">数据加载失败</p>
        <p className="text-xs">{error?.message}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
        <FileText size={24} />
        <p className="text-sm">暂无内容</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">标题</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 w-16">平台</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 w-24">账号</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 w-14">类型</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 w-24">发布日期</th>
            <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 w-16">AI 分</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const displayTitle = getDisplayTitle(item);
            return (
              <tr
                key={item.content_id}
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  if (item.content_url) {
                    window.open(item.content_url, '_blank', 'noopener,noreferrer');
                  } else {
                    router.push(`/content/${item.content_id}`);
                  }
                }}
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-1.5 max-w-md">
                    <span className="text-gray-800 truncate" title={displayTitle}>
                      {displayTitle}
                    </span>
                    {item.content_url && (
                      <ExternalLink size={12} className="text-gray-400 shrink-0" />
                    )}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      PLATFORM_COLORS[item.platform] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {PLATFORM_LABELS[item.platform] ?? item.platform}
                  </span>
                </td>
                <td className="py-3 px-2 text-gray-600 truncate max-w-[120px]">
                  {item.account_name}
                </td>
                <td className="py-3 px-2 text-gray-500 text-xs">
                  {TYPE_LABELS[item.content_type ?? ''] ?? item.content_type ?? '--'}
                </td>
                <td className="py-3 px-2 text-gray-500 text-xs">
                  {formatDate(item.publish_date)}
                </td>
                <td className="py-3 px-2 text-right">
                  <ScoreCell score={item.ai_score} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
