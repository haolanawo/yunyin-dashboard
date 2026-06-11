'use client';

import { useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  useBilibiliInteractionSummary,
  useMetricsTrend,
  type PlatformKey,
} from '@/features/analytics/hooks/useAnalytics';

function formatNumber(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString('zh-CN');
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64 animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded" />
    </div>
  );
}

function PlatformSwitch({
  value,
  onChange,
}: {
  value: PlatformKey;
  onChange: (value: PlatformKey) => void;
}) {
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 mb-4">
      {[
        { key: 'zhihu' as const, label: '知乎' },
        { key: 'bilibili' as const, label: 'B站' },
      ].map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            value === item.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function BilibiliSnapshot() {
  const { data, isLoading, isError, error } = useBilibiliInteractionSummary();

  if (isLoading) return <LoadingSkeleton />;
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <AlertCircle size={20} className="text-red-400" />
        <p className="text-sm">B站数据加载失败</p>
        <p className="text-xs">{error?.message}</p>
      </div>
    );
  }

  const chartData = [
    { name: '点赞', value: data?.likes ?? 0 },
    { name: '收藏', value: data?.favorites ?? 0 },
    { name: '投币', value: data?.coins ?? 0 },
    { name: '分享', value: data?.shares ?? 0 },
  ];

  return (
    <div>
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
        <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs leading-5 text-amber-800">
          B站目前只有本次爬取的当前快照，没有每日历史快照；这里先展示互动结构。要做真正趋势，需要每天把 B站指标写入快照表。
        </p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={formatNumber} />
          <Tooltip formatter={(value: number) => [formatNumber(value), '数量']} />
          <Bar dataKey="value" name="当前累计" fill="#ec4899" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-xs text-gray-400 mt-2">覆盖 B站视频：{data?.videos ?? 0} 条</div>
    </div>
  );
}

export default function TrendChart({ defaultPlatform = 'zhihu' }: { defaultPlatform?: PlatformKey }) {
  const [platform, setPlatform] = useState<PlatformKey>(defaultPlatform);
  const { data, isLoading, isError, error } = useMetricsTrend(platform);

  return (
    <div>
      <PlatformSwitch value={platform} onChange={setPlatform} />

      {platform === 'bilibili' ? (
        <BilibiliSnapshot />
      ) : (
        <>
          {isLoading && <LoadingSkeleton />}

          {isError && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
              <AlertCircle size={20} className="text-red-400" />
              <p className="text-sm">数据加载失败</p>
              <p className="text-xs">{error?.message}</p>
            </div>
          )}

          {!isLoading && !isError && (!data || data.length === 0) && (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p className="text-sm">暂无数据</p>
            </div>
          )}

          {!isLoading && !isError && data && data.length > 0 && (
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={formatNumber} />
                <Tooltip formatter={(value: number) => [formatNumber(value), '']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="likes"
                  name="点赞"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="comments"
                  name="评论"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}
