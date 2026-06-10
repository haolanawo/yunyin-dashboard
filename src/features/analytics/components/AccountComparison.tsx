// ============================================================
// AccountComparison — 账号对比柱状图
// ============================================================

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { useAccountComparison } from '@/features/analytics/hooks/useAnalytics';

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64 animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded" />
    </div>
  );
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

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis
          dataKey="account_name"
          type="category"
          tick={{ fontSize: 11 }}
          stroke="#9ca3af"
          width={80}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            name === 'content_count' ? `${value} 条` : value.toFixed(2),
            name === 'content_count' ? '内容数' : '平均 AI 分',
          ]}
        />
        <Bar dataKey="content_count" name="内容数" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
