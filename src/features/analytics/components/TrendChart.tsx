'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMetricsTrend, type PlatformKey } from '@/features/analytics/hooks/useAnalytics';

function formatNumber(value: number): string {
  const n = Number(value ?? 0);
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString('zh-CN');
}

function LoadingSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center animate-pulse">
      <div className="h-48 w-full rounded bg-gray-200" />
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
    <label className="mb-4 flex items-center gap-2 text-xs text-gray-500">
      平台
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as PlatformKey)}
        className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 outline-none focus:border-brand-400"
      >
        <option value="zhihu">知乎</option>
        <option value="bilibili">B站</option>
      </select>
    </label>
  );
}

export default function TrendChart({ defaultPlatform = 'zhihu' }: { defaultPlatform?: PlatformKey }) {
  const [platform, setPlatform] = useState<PlatformKey>(defaultPlatform);
  const { data: payload, isLoading, isError, error } = useMetricsTrend(platform);
  const data = payload?.data;
  const platformLabel = platform === 'zhihu' ? '知乎' : 'B站';

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PlatformSwitch value={platform} onChange={setPlatform} />
        <div className="text-xs leading-5 text-gray-500">
          最近 90 天真实采样趋势；无采样日期不会再被前端补成连续累计值。
        </div>
      </div>

      {isLoading && <LoadingSkeleton />}

      {isError && (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-400">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-sm">数据加载失败</p>
          <p className="text-xs">{error?.message ?? '未知错误'}</p>
        </div>
      )}

      {!isLoading && !isError && (!data || data.length === 0) && (
        <div className="flex h-64 items-center justify-center text-gray-400">
          <p className="text-sm">暂无趋势数据</p>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={formatNumber} />
              <Tooltip
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                formatter={(value: number, name: string) => [formatNumber(value), name]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="likes"
                name="点赞"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="comments"
                name="评论"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-gray-400">
            当前平台：{platformLabel}。缓存生成于 {payload?.generatedAt ? new Date(payload.generatedAt).toLocaleString('zh-CN') : '-'}。
          </div>
        </>
      )}
    </div>
  );
}
