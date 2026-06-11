// ============================================================
// 账号详情页
// ============================================================

'use client';

import { use } from 'react';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAccountDetail } from '@/features/account-detail/hooks/useAccountDetail';
import AccountHeader from '@/features/account-detail/components/AccountHeader';
import AccountPostTable from '@/features/account-detail/components/AccountPostTable';

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
      <p className="text-lg text-gray-600">账号未找到</p>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError, error } = useAccountDetail(id);

  if (isLoading) return <LoadingView />;
  if (isError || !data) return <ErrorView message={error?.message ?? '该账号不存在或已被删除'} />;

  const totalVotes = data.posts.reduce((sum, p) => sum + (p.votes ?? 0), 0);
  const scores = data.posts.map((p) => p.ai_score).filter((s): s is number => s !== null);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  return (
    <div className="p-6 space-y-6">
      <Link
        href="/contents"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        返回列表
      </Link>

      <AccountHeader
        account={data.account}
        postCount={data.posts.length}
        totalVotes={totalVotes}
        avgScore={avgScore}
      />

      <div className="bg-white rounded-lg border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">全部帖子 ({data.posts.length})</h3>
        <AccountPostTable posts={data.posts} />
      </div>
    </div>
  );
}
