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

interface ContentTableProps {
  items: ContentItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

function formatDate(value: string | null): string {
  return value || '--';
}

function getDisplayTitle(item: ContentItem): string {
  if (item.title) return item.title;
  if (item.content_type === 'answer' && item.question_id) return `知乎问题 #${item.question_id}`;
  return item.content_type === 'answer' ? '知乎回答' : '无标题';
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-400">--</span>;
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500';
  return <span className={`text-xs font-semibold ${color}`}>{score.toFixed(1)}</span>;
}

function LoadingSkeleton() {
  const titleWidths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-3/5'];
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-4 border-b border-gray-100 px-2 py-3">
        <div className="flex-1" />
        <div className="w-16" />
        <div className="w-24" />
        <div className="w-14" />
        <div className="w-24" />
        <div className="w-16" />
      </div>
      {[1, 2, 3, 4, 5].map((index) => (
        <div key={index} className="flex items-center gap-4 border-b border-gray-50 px-2 py-3">
          <div className="flex-1">
            <div className={`skeleton-shimmer h-4 rounded ${titleWidths[index - 1]}`} />
          </div>
          <div className="flex w-16 justify-center">
            <div className="skeleton-shimmer h-5 w-10 rounded" />
          </div>
          <div className="w-24">
            <div className="skeleton-shimmer h-4 w-16 rounded" />
          </div>
          <div className="flex w-14 justify-center">
            <div className="skeleton-shimmer h-4 w-8 rounded" />
          </div>
          <div className="w-24">
            <div className="skeleton-shimmer h-4 w-20 rounded" />
          </div>
          <div className="flex w-16 justify-end">
            <div className="skeleton-shimmer h-4 w-10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ContentTable({ items, isLoading, isError, error }: ContentTableProps) {
  const router = useRouter();

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
        <AlertCircle size={24} className="text-red-400" />
        <p className="text-sm">数据加载失败</p>
        <p className="text-xs">{error?.message}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
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
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500">标题</th>
            <th className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500">平台</th>
            <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500">账号</th>
            <th className="w-14 px-2 py-3 text-left text-xs font-medium text-gray-500">类型</th>
            <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500">发布日期</th>
            <th className="w-16 px-2 py-3 text-right text-xs font-medium text-gray-500">AI 分</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const displayTitle = getDisplayTitle(item);
            return (
              <tr
                key={item.content_id}
                className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50"
                onClick={() => {
                  if (item.content_url) {
                    window.open(item.content_url, '_blank', 'noopener,noreferrer');
                  } else {
                    router.push(`/content/${item.content_id}`);
                  }
                }}
              >
                <td className="px-2 py-3">
                  <div className="flex max-w-md items-center gap-1.5">
                    <span className="truncate text-gray-800" title={displayTitle}>
                      {displayTitle}
                    </span>
                    {item.content_url && <ExternalLink size={12} className="shrink-0 text-gray-400" />}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      PLATFORM_COLORS[item.platform] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {PLATFORM_LABELS[item.platform] ?? item.platform}
                  </span>
                </td>
                <td className="max-w-[120px] truncate px-2 py-3 text-gray-600">{item.account_name}</td>
                <td className="px-2 py-3 text-xs text-gray-500">
                  {TYPE_LABELS[item.content_type ?? ''] ?? item.content_type ?? '--'}
                </td>
                <td className="px-2 py-3 text-xs text-gray-500">{formatDate(item.publish_date)}</td>
                <td className="px-2 py-3 text-right">
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
