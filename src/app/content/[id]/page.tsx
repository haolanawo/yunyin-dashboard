// ============================================================
// 内容详情页
// ============================================================

'use client';

import { use } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useContentDetail } from '@/features/post-detail/hooks/useContentDetail';
import ContentHeader from '@/features/post-detail/components/ContentHeader';
import StructuralLabels from '@/features/post-detail/components/StructuralLabels';
import ContentMetrics from '@/features/post-detail/components/ContentMetrics';
import ContentText from '@/features/post-detail/components/ContentText';

function LoadingView() {
  return (
    <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
      <Loader2 size={24} className="animate-spin" />
      <span>加载中...</span>
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
