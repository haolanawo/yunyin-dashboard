// ============================================================
// TrendLineChart — 趋势折线图（多账号对比）
// ============================================================

'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { AccountTrend } from '@/features/trends/hooks/useTrends';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export default function TrendLineChart({
  trends,
  metric,
}: {
  trends: AccountTrend[];
  metric: 'votes' | 'comments';
}) {
  const { chartData, accountNames } = useMemo(() => {
    const accountSet = new Set<string>();
    const dateMap = new Map<string, Record<string, number>>();

    trends.forEach((t) => {
      accountSet.add(t.account_name);
      if (!dateMap.has(t.date)) dateMap.set(t.date, {});
      dateMap.get(t.date)![t.account_name] = t[metric];
    });

    const names = Array.from(accountSet);
    const data: ChartDataPoint[] = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date,
        ...values,
      }));

    return { chartData: data, accountNames: names };
  }, [trends, metric]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-sm">暂无数据</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <Tooltip />
        <Legend />
        {accountNames.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            name={name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
