// ============================================================
// InteractionChart — UP主总互动对比柱状图
// ============================================================

'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { useBilibiliInteractions } from '@/features/bilibili-analytics/hooks/useBilibiliAnalytics';

function formatNum(n: number): string {
  if (n >= 1_0000_0000) return (n / 1_0000_0000).toFixed(1) + '亿';
  if (n >= 1_0000) return (n / 1_0000).toFixed(1) + '万';
  return String(n);
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
      total: (item.total_likes + item.total_favorites + item.total_coins + item.total_shares + item.total_danmaku),
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
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={formatNum} />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 11 }}
          stroke="#9ca3af"
          width={100}
        />
        <Tooltip formatter={(value: number) => [formatNum(value), '互动量']} />
        <Legend />
        <Bar dataKey="total" name="总互动" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
