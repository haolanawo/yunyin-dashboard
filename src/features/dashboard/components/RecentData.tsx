'use client';

import { AlertCircle, Clock, FileText } from 'lucide-react';
import { useRecentContents, type RecentContent } from '@/features/dashboard/hooks/useDashboardData';

const platformLabels: Record<string, string> = {
  zhihu: '知乎',
  bilibili: 'B站',
};

const platformColors: Record<string, string> = {
  zhihu: 'bg-blue-100 text-blue-700',
  bilibili: 'bg-pink-100 text-pink-700',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  return dateStr.slice(0, 10);
}

function truncateTitle(title: string | null, maxLen = 32): string {
  if (!title) return '无标题';
  return title.length > maxLen ? `${title.slice(0, maxLen)}...` : title;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentItem({ item }: { item: RecentContent }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded px-2 -mx-2 transition-colors">
      <FileText size={16} className="text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 truncate" title={item.title ?? undefined}>
            {truncateTitle(item.title)}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
              platformColors[item.platform] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {platformLabels[item.platform] ?? item.platform}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{item.account_name}</span>
          <span className="text-xs text-gray-300">/</span>
          <span className="text-xs text-gray-400">{formatDate(item.publish_date)}</span>
        </div>
      </div>
    </div>
  );
}

export default function RecentData() {
  const { data: items, isLoading, isError, error } = useRecentContents(6);

  return (
    <div>
      {isLoading && <LoadingSkeleton />}

      {isError && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-sm">数据加载失败</p>
          <p className="text-xs text-gray-400">{error?.message}</p>
        </div>
      )}

      {!isLoading && !isError && items && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
          <Clock size={20} />
          <p className="text-sm">暂无数据</p>
        </div>
      )}

      {!isLoading && !isError && items && items.length > 0 && (
        <div className="space-y-0">
          {items.map((item) => (
            <ContentItem key={item.content_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
