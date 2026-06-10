// ============================================================
// TrendChart — 指标趋势折线图
// ============================================================

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { useMetricsTrend } from '@/features/analytics/hooks/useAnalytics';

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64 animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded" />
    </div>
  );
}

export default function TrendChart() {
  const { data, isLoading, isError, error } = useMetricsTrend();

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
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="votes"
          name="点赞"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="comments"
          name="评论"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
