// ============================================================
// VideoCountChart — UP主视频数对比柱状图
// ============================================================

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { useBilibiliVideoCounts } from '@/features/bilibili-analytics/hooks/useBilibiliAnalytics';

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64 animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded" />
    </div>
  );
}

export default function VideoCountChart() {
  const { data, isLoading, isError, error } = useBilibiliVideoCounts();

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

  const chartData = data.slice(0, 15).map((item) => ({
    name: item.account_name,
    count: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 11 }}
          stroke="#9ca3af"
          width={100}
        />
        <Tooltip formatter={(value: number) => [`${value} 个视频`, '数量']} />
        <Bar dataKey="count" name="视频数" fill="#f472b6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
