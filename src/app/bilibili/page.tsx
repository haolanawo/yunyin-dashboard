// ============================================================
// B站内容列表页 — 展示所有 B站视频及其互动数据
// ============================================================

'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { Play } from 'lucide-react';
import { useBilibiliVideos } from '@/features/bilibili/hooks/useBilibiliVideos';

const BilibiliVideoTable = dynamic(
  () => import('@/features/bilibili/components/BilibiliVideoTable'),
);

const PAGE_SIZE = 50;

function TableSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-3 border-b border-gray-50">
          <div className="skeleton-shimmer w-[120px] h-[68px] rounded shrink-0" />
          <div className="flex-1 min-w-0">
            <div className={`skeleton-shimmer h-4 rounded ${['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-3/5'][i - 1]}`} />
          </div>
          <div className="skeleton-shimmer h-4 w-16 rounded" />
          <div className="skeleton-shimmer h-4 w-20 rounded" />
          <div className="skeleton-shimmer h-4 w-16 rounded" />
          <div className="skeleton-shimmer h-4 w-14 rounded" />
          <div className="skeleton-shimmer h-4 w-14 rounded" />
          <div className="skeleton-shimmer h-4 w-14 rounded" />
          <div className="skeleton-shimmer h-4 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function BilibiliPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error } = useBilibiliVideos(page);

  const videos = data?.videos ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Play size={20} className="text-pink-500" />
        <h1 className="text-xl font-bold text-gray-900">B站视频</h1>
        <span className="text-sm text-gray-400">
          {isLoading ? '加载中...' : `共 ${total} 条`}
        </span>
      </div>

      {/* 表格区域 */}
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <Suspense fallback={<TableSkeleton />}>
          <BilibiliVideoTable
            videos={videos}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
        </Suspense>
      </div>

      {/* 分页 */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40
              hover:bg-gray-50 transition-colors"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40
              hover:bg-gray-50 transition-colors"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
