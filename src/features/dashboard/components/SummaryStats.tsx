// ============================================================
// SummaryStats — 核心指标卡片
// 显示 4 个 KPI 数字卡片（账号数、内容数、总点赞、平均AI分）
// 数据源：Supabase（通过 useDashboardData hooks）
// ============================================================

'use client';

import { TrendingUp, Users, FileText, ThumbsUp } from 'lucide-react';
import {
  useAccountsCount,
  useContentsCount,
  useTotalVotes,
  useMaxVotes,
} from '@/features/dashboard/hooks/useDashboardData';

/** 格式化数字 — 超过 1000 用 k 表示 */
function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

interface StatCardProps {
  label: string;
  value: string;
  isLoading: boolean;
  isError: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  change?: string;
}

function StatCard({ label, value, isLoading, isError, icon: Icon, color, change }: StatCardProps) {
  let displayValue = value;
  if (isLoading) displayValue = '加载中...';
  else if (isError) displayValue = '获取失败';

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <Icon size={20} className={color} />
      </div>
      <div className={`text-2xl font-bold ${isError ? 'text-red-500' : 'text-gray-900'}`}>
        {displayValue}
      </div>
      {change && !isLoading && !isError && (
        <div className="text-xs text-gray-400 mt-1">{change}</div>
      )}
    </div>
  );
}

export default function SummaryStats() {
  const { data: accountsCount, isLoading: accountsLoading, isError: accountsError } = useAccountsCount();
  const { data: contentsCount, isLoading: contentsLoading, isError: contentsError } = useContentsCount();
  const { data: totalVotes, isLoading: votesLoading, isError: votesError } = useTotalVotes();
  const { data: maxVotes, isLoading: maxLoading, isError: maxError } = useMaxVotes();

  const stats = [
    {
      label: '监控账号',
      value: accountsCount !== undefined ? formatNumber(accountsCount) : '--',
      isLoading: accountsLoading,
      isError: accountsError,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: '内容总数',
      value: contentsCount !== undefined ? formatNumber(contentsCount) : '--',
      isLoading: contentsLoading,
      isError: contentsError,
      icon: FileText,
      color: 'text-green-600',
    },
    {
      label: '总点赞数',
      value: totalVotes !== undefined ? formatNumber(totalVotes) : '--',
      isLoading: votesLoading,
      isError: votesError,
      icon: ThumbsUp,
      color: 'text-yellow-600',
    },
    {
      label: '最高单篇赞',
      value: maxVotes !== undefined ? formatNumber(maxVotes) : '--',
      isLoading: maxLoading,
      isError: maxError,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
