// ============================================================
// 账号对比（内容数 + 总赞同数双柱图）
// ============================================================

'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import { useAccountComparison } from '@/features/analytics/hooks/useAnalytics';

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64 animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded" />
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function AccountComparison() {
  const { data, isLoading, isError, error } = useAccountComparison();

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <AlertCircle size={20} className="text-red-400" />
        <p className="text-sm">数据加载失败</p>
        <p className="text-xs">{error?.message}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-sm">暂无数据</p>
      </div>
    );
  }

  // Normalize total_votes to comparable scale
  const maxCount = Math.max(...data.map(d => d.content_count), 1);
  const maxVotes = Math.max(...data.map(d => d.total_votes), 1);
  const chartData = data.map(d => ({
    ...d,
    votes_norm: Number((d.total_votes / maxVotes * maxCount).toFixed(1)),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const raw = data.find(d => d.account_name === label);
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs">
        <p className="font-medium text-gray-800 mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-gray-600">
            {entry.name === 'content_count' ? '📄 内容数' : '👍 总赞同'}：{entry.name === 'content_count' ? entry.value : formatNum(raw?.total_votes ?? 0)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" barGap={4} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis
          dataKey="account_name"
          type="category"
          tick={{ fontSize: 11 }}
          stroke="#9ca3af"
          width={80}
          tickFormatter={(v: string) => v.length > 6 ? v.slice(0, 6) + '…' : v}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => (value === 'content_count' ? '内容数' : '总赞同数')}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Bar dataKey="content_count" name="content_count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        <Bar dataKey="votes_norm" name="votes_norm" fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
