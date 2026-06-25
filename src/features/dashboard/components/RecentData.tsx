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

function truncateTitle(title: string, maxLen = 34): string {
  return title.length > maxLen ? `${title.slice(0, maxLen)}...` : title;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="flex-1">
            <div className="mb-1 h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentItem({ item }: { item: RecentContent }) {
  const label = platformLabels[item.platform] ?? item.platform;
  const color = platformColors[item.platform] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="flex items-center gap-3 rounded px-2 py-2.5 transition-colors hover:bg-gray-50">
      <FileText size={16} className="shrink-0 text-gray-400" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-800" title={item.title}>
            {truncateTitle(item.title)}
          </span>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${color}`}>{label}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>{item.account_name}</span>
          <span className="text-gray-300">/</span>
          <span>{item.publish_date}</span>
        </div>
      </div>
    </div>
  );
}

export default function RecentData() {
  const { data: payload, isLoading, isError, error } = useRecentContents(6);
  const items = payload?.data;

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">最新入库内容</h3>
        <span className="text-xs text-gray-500">用于检查近期采集是否连续</span>
      </div>

      {isLoading && <LoadingSkeleton />}

      {isError && (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-sm">数据加载失败</p>
          <p className="text-xs text-gray-400">{error?.message ?? '未知错误'}</p>
        </div>
      )}

      {!isLoading && !isError && (!items || items.length === 0) && (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
          <Clock size={20} />
          <p className="text-sm">暂无入库记录</p>
        </div>
      )}

      {!isLoading && !isError && items && items.length > 0 && (
        <div className="divide-y divide-gray-50">
          {items.map((item) => (
            <ContentItem key={item.content_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
