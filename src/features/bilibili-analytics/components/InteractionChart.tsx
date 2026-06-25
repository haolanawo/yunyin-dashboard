'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { useBilibiliInteractions } from '@/features/bilibili-analytics/hooks/useBilibiliAnalytics';

function formatRate(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64 animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded" />
    </div>
  );
}

export default function InteractionChart() {
  const { data, isLoading, isError, error } = useBilibiliInteractions();

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.slice(0, 12).map((item) => ({
      name: item.account_name,
      rate: item.interaction_rate,
    }));
  }, [data]);

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

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-sm">暂无数据</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={formatRate} />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 11 }}
          stroke="#9ca3af"
          width={100}
        />
        <Tooltip formatter={(value: number) => [formatRate(value), '互动比']} />
        <Legend />
        <Bar dataKey="rate" name="互动比" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
