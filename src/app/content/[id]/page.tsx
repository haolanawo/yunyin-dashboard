// ============================================================
// 内容详情页
// ============================================================

'use client';

import { use } from 'react';
import { AlertCircle } from 'lucide-react';
import { useContentDetail } from '@/features/post-detail/hooks/useContentDetail';
import ContentHeader from '@/features/post-detail/components/ContentHeader';
import StructuralLabels from '@/features/post-detail/components/StructuralLabels';
import ContentMetrics from '@/features/post-detail/components/ContentMetrics';
import ContentText from '@/features/post-detail/components/ContentText';

function LoadingView() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton — title + metadata */}
      <div className="space-y-3">
        <div className="skeleton-shimmer h-8 w-2/3 rounded-lg" />
        <div className="flex gap-4">
          <div className="skeleton-shimmer h-5 w-20 rounded" />
          <div className="skeleton-shimmer h-5 w-28 rounded" />
          <div className="skeleton-shimmer h-5 w-16 rounded" />
        </div>
        <div className="skeleton-shimmer h-4 w-1/3 rounded" />
      </div>
      {/* Grid skeleton matching page layout: 2/3 + 1/3 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Metrics card skeleton */}
          <div className="rounded-lg border border-gray-100 p-5">
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 space-y-2">
                  <div className="skeleton-shimmer h-3 w-12 rounded" />
                  <div className="skeleton-shimmer h-6 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
          {/* Content text skeleton — lines of varying width */}
          <div className="space-y-2">
            <div className="skeleton-shimmer h-4 rounded w-full" />
            <div className="skeleton-shimmer h-4 rounded w-[90%]" />
            <div className="skeleton-shimmer h-4 rounded w-[95%]" />
            <div className="skeleton-shimmer h-4 rounded w-[80%]" />
            <div className="skeleton-shimmer h-4 rounded w-[85%]" />
            <div className="skeleton-shimmer h-4 rounded w-[70%]" />
            <div className="skeleton-shimmer h-4 rounded w-[50%]" />
          </div>
        </div>
        {/* Structural labels skeleton */}
        <div className="col-span-1 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-shimmer h-10 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
      <AlertCircle size={32} className="text-red-400" />
      <p className="text-lg text-gray-600">内容未找到</p>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: content, isLoading, isError, error } = useContentDetail(id);

  if (isLoading) return <LoadingView />;
  if (isError || !content) return <ErrorView message={error?.message ?? '该内容不存在或已被删除'} />;

  return (
    <div className="p-6 space-y-6">
      <ContentHeader content={content} />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <ContentMetrics contentId={id} />
          <ContentText text={content.text} />
        </div>
        <div className="col-span-1">
          <StructuralLabels content={content} />
        </div>
      </div>
    </div>
  );
}
