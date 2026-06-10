// ============================================================
// PlatformChart — 平台内容分布饼图
// ============================================================

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { usePlatformDistribution } from '@/features/analytics/hooks/useAnalytics';

const PLATFORM_LABELS: Record<string, string> = { zhihu: '知乎', bilibili: 'B站' };
const PLATFORM_COLORS: Record<string, string> = { zhihu: '#3b82f6', bilibili: '#ec4899' };
const FALLBACK_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981'];

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64 animate-pulse">
      <div className="w-48 h-48 bg-gray-200 rounded-full" />
    </div>
  );
}

export default function PlatformChart() {
  const { data, isLoading, isError, error } = usePlatformDistribution();

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

  const chartData = (data ?? []).map((item) => ({
    name: PLATFORM_LABELS[item.platform] ?? item.platform,
    value: item.count,
    platform: item.platform,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-sm">暂无数据</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={entry.platform}
              fill={PLATFORM_COLORS[entry.platform] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`${value} 条`, name]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
