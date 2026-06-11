'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { useMetricsTrend, type PlatformKey } from '@/features/analytics/hooks/useAnalytics';

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

export default function TrendChart({ defaultPlatform = 'zhihu' }: { defaultPlatform?: PlatformKey }) {
  const [platform, setPlatform] = useState<PlatformKey>(defaultPlatform);
  const { data, isLoading, isError, error } = useMetricsTrend(platform);

  return (
    <div>
      <PlatformSwitch value={platform} onChange={setPlatform} />

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
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="likes"
              name={platform === 'zhihu' ? '点赞' : '点赞'}
              stroke={platform === 'zhihu' ? '#2563eb' : '#ec4899'}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="comments"
              name={platform === 'zhihu' ? '评论' : '收藏+分享'}
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
