// ============================================================
// 账号管理页 — 展示所有知乎和B站账号
// ============================================================

'use client';

import { useRouter } from 'next/navigation';
import { Users, ExternalLink, Monitor, AlertCircle } from 'lucide-react';
import { useAllAccounts, type AccountCard } from '@/features/accounts/hooks/useAccounts';

const PLATFORM_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  zhihu: { label: '知乎', icon: '知', bg: 'bg-blue-100', text: 'text-blue-700' },
  bilibili: { label: 'B站', icon: 'B', bg: 'bg-pink-100', text: 'text-pink-700' },
};

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="skeleton-shimmer w-12 h-12 rounded-full shrink-0" />
            <div className="flex-1">
              <div className="skeleton-shimmer h-4 w-24 rounded mb-1" />
              <div className="skeleton-shimmer h-3 w-16 rounded" />
            </div>
          </div>
          <div className="flex gap-4 mt-3">
            <div className="skeleton-shimmer h-4 w-16 rounded" />
            <div className="skeleton-shimmer h-4 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AccountCardItem({ account }: { account: AccountCard }) {
  const router = useRouter();
  const config = PLATFORM_CONFIG[account.platform] ?? { label: account.platform, icon: '?', bg: 'bg-gray-100', text: 'text-gray-600' };

  const handleClick = () => {
    if (account.platform === 'bilibili' && account.bilibili_uid) {
      window.open(`https://space.bilibili.com/${account.bilibili_uid}`, '_blank', 'noopener,noreferrer');
    } else if (account.platform === 'zhihu') {
      router.push(`/account/${account.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
    >
      {/* Top row: avatar + info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative shrink-0">
          {account.avatar ? (
            <img
              src={account.avatar}
              alt={account.nickname}
              className="w-12 h-12 rounded-full object-cover bg-gray-100"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${config.bg} ${config.text} ${account.avatar ? 'hidden' : ''}`}>
            {account.nickname.charAt(0)}
          </div>
          {/* Platform badge */}
          <span className={`absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.bg} ${config.text} border border-white`}>
            {config.label}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 truncate">{account.nickname}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {account.platform === 'bilibili' ? (
              <span className="inline-flex items-center gap-1">
                空间 <ExternalLink size={10} />
              </span>
            ) : '查看详情'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>内容 <strong className="text-gray-700">{account.content_count}</strong></span>
        <span>互动 <strong className="text-gray-700">
          {account.total_interactions !== null
            ? account.total_interactions >= 10000
              ? `${(account.total_interactions / 10000).toFixed(1)}万`
              : account.total_interactions.toLocaleString('zh-CN')
            : '--'}
        </strong></span>
      </div>

      {/* 虚拟指纹浏览器按钮 */}
      <div className="mt-3 pt-3 border-t border-gray-50">
        <button
          disabled
          className="w-full px-3 py-1.5 text-xs text-gray-300 bg-gray-50 rounded-md cursor-not-allowed inline-flex items-center justify-center gap-1.5"
          title="即将支持：通过虚拟指纹浏览器打开账号主页"
        >
          <Monitor size={12} />
          指纹浏览器打开
        </button>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const { data: accounts, isLoading, isError, error } = useAllAccounts();

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users size={20} className="text-indigo-500" />
        <h1 className="text-xl font-bold text-gray-900">账号管理</h1>
        <span className="text-sm text-gray-400">
          {isLoading ? '加载中...' : `共 ${accounts?.length ?? 0} 个账号`}
        </span>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
          <AlertCircle size={24} className="text-red-400" />
          <p className="text-sm">数据加载失败</p>
          <p className="text-xs">{error?.message}</p>
        </div>
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : !accounts || accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
          <Users size={24} className="text-gray-300" />
          <p className="text-sm">暂无账号</p>
          <p className="text-xs">请先导入知乎或B站账号数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCardItem key={`${account.platform}-${account.id}`} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
