// ============================================================
// AccountHeader — 账号信息统计卡片
// ============================================================

'use client';

import { Users, FileText, ThumbsUp, TrendingUp } from 'lucide-react';
import type { AccountInfo } from '@/features/account-detail/hooks/useAccountDetail';

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return '--';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function AccountHeader({
  account,
  postCount,
  totalVotes,
  avgScore,
}: {
  account: AccountInfo;
  postCount: number;
  totalVotes: number;
  avgScore: number | null;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">{account.account_name}</h1>
      <div className="grid grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-blue-500" />
          <div>
            <div className="text-lg font-bold text-gray-900">{formatNumber(account.follower_count)}</div>
            <div className="text-xs text-gray-500">粉丝数</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-green-500" />
          <div>
            <div className="text-lg font-bold text-gray-900">{formatNumber(account.total_answers ?? postCount)}</div>
            <div className="text-xs text-gray-500">总回答</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThumbsUp size={20} className="text-yellow-500" />
          <div>
            <div className="text-lg font-bold text-gray-900">{formatNumber(totalVotes)}</div>
            <div className="text-xs text-gray-500">总点赞</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TrendingUp size={20} className="text-purple-500" />
          <div>
            <div className="text-lg font-bold text-gray-900">{avgScore !== null ? avgScore.toFixed(2) : '--'}</div>
            <div className="text-xs text-gray-500">平均 AI 分</div>
          </div>
        </div>
      </div>
    </div>
  );
}
