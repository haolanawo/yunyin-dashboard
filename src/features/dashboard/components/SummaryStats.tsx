'use client';

import { BarChart3, FileText, Layers, ThumbsUp, Users } from 'lucide-react';
import { useExecutiveOverview } from '@/features/dashboard/hooks/useDashboardData';

function formatNumber(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString('zh-CN');
}

interface StatCardProps {
  label: string;
  value: string;
  note: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  isLoading: boolean;
}

function StatCard({ label, value, note, icon: Icon, color, isLoading }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{label}</span>
        <Icon size={20} className={color} />
      </div>
      <div className="text-3xl font-semibold tracking-normal text-gray-950">
        {isLoading ? '加载中' : value}
      </div>
      <div className="text-xs text-gray-500 mt-2">{note}</div>
    </div>
  );
}

export default function SummaryStats() {
  const { data, isLoading, isError, error } = useExecutiveOverview();

  if (isError) {
    return (
      <div className="col-span-12 bg-red-50 border border-red-100 rounded-lg p-5 text-sm text-red-700">
        经营总览加载失败：{error?.message}
      </div>
    );
  }

  const stats = [
    {
      label: '覆盖平台',
      value: formatNumber(data?.platformCount ?? 0),
      note: '知乎 + B站，后续可继续接入新平台',
      icon: Layers,
      color: 'text-indigo-600',
    },
    {
      label: '受控账号',
      value: formatNumber(data?.accountCount ?? 0),
      note: `知乎 ${data?.zhihuAccounts ?? 0} 个，B站 ${data?.bilibiliAccounts ?? 0} 个`,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: '内容资产',
      value: formatNumber(data?.contentCount ?? 0),
      note: `知乎 ${data?.zhihuContents ?? 0} 篇，B站 ${data?.bilibiliContents ?? 0} 条`,
      icon: FileText,
      color: 'text-emerald-600',
    },
    {
      label: '累计点赞',
      value: formatNumber(data?.totalLikes ?? 0),
      note: `知乎 ${formatNumber(data?.zhihuLikes ?? 0)}，B站 ${formatNumber(data?.bilibiliLikes ?? 0)}`,
      icon: ThumbsUp,
      color: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-lg p-5">
        <div className="flex items-center gap-2 text-gray-900">
          <BarChart3 size={20} className="text-brand-500" />
          <h2 className="text-base font-semibold">跨平台内容运营总览</h2>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          面向经营复盘展示：我们控制了多少账号、沉淀了多少内容资产、跨平台获得了多少互动。
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} isLoading={isLoading} />
        ))}
      </div>
    </div>
  );
}
