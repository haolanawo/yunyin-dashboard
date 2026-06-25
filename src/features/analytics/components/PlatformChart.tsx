'use client';

import { AlertCircle, TicketPercent } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { usePlatformDistribution, type PlatformDist } from '@/features/analytics/hooks/useAnalytics';

const PLATFORM_LABELS: Record<string, string> = { zhihu: '知乎', bilibili: 'B站' };
const PLATFORM_COLORS: Record<string, string> = { zhihu: '#2563eb', bilibili: '#ec4899' };
const FALLBACK_COLORS = ['#2563eb', '#ec4899', '#10b981', '#f59e0b'];

function formatNumber(value: number): string {
  const n = Number(value ?? 0);
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString('zh-CN');
}

function Donut({
  title,
  data,
  dataKey,
}: {
  title: string;
  data: PlatformDist[];
  dataKey: 'count' | 'traffic';
}) {
  const chartData = data
    .map((item) => ({
      name: PLATFORM_LABELS[item.platform] ?? item.platform,
      value: item[dataKey],
      platform: item.platform,
    }))
    .filter((item) => dataKey === 'count' || item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="min-w-0">
        <div className="mb-2 text-xs font-medium text-gray-500">{title}</div>
        <div className="flex h-[188px] items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400">
          暂无最新快照播放量
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="mb-2 text-xs font-medium text-gray-500">{title}</div>
      <ResponsiveContainer width="100%" height={188}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={4} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell
                key={entry.platform}
                fill={PLATFORM_COLORS[entry.platform] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [formatNumber(value), name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1">
        {chartData.map((item) => (
          <div key={item.platform} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-500">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: PLATFORM_COLORS[item.platform] ?? '#9ca3af' }}
              />
              {item.name}
            </span>
            <span className="font-medium text-gray-800">{formatNumber(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvitePlaceholder() {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-gray-500">邀请码转换</div>
      <div className="flex h-[188px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-400">
        <TicketPercent size={28} className="mb-2" />
        <div className="text-xs">预留转换圆盘</div>
      </div>
      <div className="mt-2 text-xs text-gray-400">等待邀请码链路接入后展示转化率</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-56 rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

export default function PlatformChart() {
  const { data: payload, isLoading, isError, error } = usePlatformDistribution();
  const data = payload?.data;

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-400">
        <AlertCircle size={20} className="text-red-400" />
        <p className="text-sm">数据加载失败</p>
        <p className="text-xs">{error?.message ?? '未知错误'}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <p className="text-sm">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Donut title="内容分布" data={data} dataKey="count" />
      <Donut title="播放量分布（最新快照）" data={data} dataKey="traffic" />
      <InvitePlaceholder />
    </div>
  );
}
