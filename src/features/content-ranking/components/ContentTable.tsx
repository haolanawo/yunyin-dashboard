// ============================================================
// ContentTable — 内容列表表格
// ============================================================

'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, FileText } from 'lucide-react';
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

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400 text-xs">--</span>;
  const color =
    score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500';
  return <span className={`text-xs font-semibold ${color}`}>{score.toFixed(1)}</span>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 bg-gray-100 rounded" />
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
          {items.map((item) => (
            <tr
              key={item.content_id}
              className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => router.push(`/content/${item.content_id}`)}
            >
              <td className="py-3 px-2">
                <span className="text-gray-800 truncate block max-w-md" title={item.title ?? undefined}>
                  {item.title ?? '无标题'}
                </span>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
