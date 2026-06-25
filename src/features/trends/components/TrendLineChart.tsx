'use client';

import { useEffect, useMemo, useState } from 'react';
import { Brush, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AccountTrend, TrendMetric } from '@/features/trends/hooks/useTrends';

const COLORS = ['#2563eb', '#db2777', '#f59e0b', '#059669', '#7c3aed', '#ef4444'];
export type TrendTrafficMode = 'daily' | 'cumulative';

interface ChartDataPoint {
  date: string;
  [key: string]: string | number | boolean | null;
}

type ChartValueMap = Record<string, string | number | boolean | null>;

function enumerateDates(start: string, end: string) {
  const result: string[] = [];
  const cursor = new Date(`${start}T00:00:00+08:00`);
  const last = new Date(`${end}T00:00:00+08:00`);

  while (cursor <= last) {
    const year = cursor.getUTCFullYear();
    const month = `${cursor.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${cursor.getUTCDate()}`.padStart(2, '0');
    result.push(`${year}-${month}-${day}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

function formatNumber(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString('zh-CN');
}

function formatRate(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

export default function TrendLineChart({
  trends,
  metric,
  trafficMode = 'cumulative',
  dateRange,
}: {
  trends: AccountTrend[];
  metric: TrendMetric;
  trafficMode?: TrendTrafficMode;
  dateRange?: { start: string; end: string };
}) {
  const { chartData, accountNames, observedDateCount } = useMemo(() => {
    const accountSet = new Set<string>();
    const dateMap = new Map<string, ChartValueMap>();
    const previousTrafficByAccount = new Map<string, number>();

    [...trends]
      .sort((a, b) => {
        const dateOrder = a.date.localeCompare(b.date);
        return dateOrder !== 0 ? dateOrder : a.account_name.localeCompare(b.account_name);
      })
      .forEach((trend) => {
      accountSet.add(trend.account_name);
      if (!dateMap.has(trend.date)) dateMap.set(trend.date, {});

      let value: number | null = trend.hasObservation ? trend[metric] : null;
      if (metric === 'traffic' && trafficMode === 'daily') {
        const previous = previousTrafficByAccount.get(trend.account_id);
        value = trend.hasObservation
          ? trend.trafficDaily ?? (previous != null ? Math.max(0, trend.traffic - previous) : null)
          : null;
        if (trend.hasObservation) previousTrafficByAccount.set(trend.account_id, trend.traffic);
      }

      dateMap.get(trend.date)![trend.account_name] = value;
      dateMap.get(trend.date)![`${trend.account_name}__observed`] = trend.hasObservation;
    });

    const names = Array.from(accountSet);
    const observedDates = Array.from(dateMap.keys()).sort((a, b) => a.localeCompare(b));

    // 只有 >= 4 个采样日时才补齐日期轴，避免 2 个数据点夹 5 个空白造成视觉混乱
    const shouldEnumerate = dateRange && observedDates.length >= 4;
    const dates = shouldEnumerate
      ? enumerateDates(dateRange.start, dateRange.end)
      : observedDates;

    const data: ChartDataPoint[] = dates.map((date) => ({
      date,
      ...(dateMap.get(date) ?? {}),
    }));

    return { chartData: data, accountNames: names, observedDateCount: observedDates.length };
  }, [trends, metric, trafficMode, dateRange]);

  const [hiddenNames, setHiddenNames] = useState<Set<string>>(() => new Set());
  const [brushWindow, setBrushWindow] = useState<{ startIndex: number; endIndex: number } | null>(null);

  useEffect(() => {
    setHiddenNames(new Set());
  }, [accountNames.join('|'), metric, trafficMode]);

  useEffect(() => {
    if (chartData.length <= 1) {
      setBrushWindow(null);
      return;
    }

    const observedIndexes = chartData
      .map((point, index) => ({ point, index }))
      .filter(({ point }) =>
        accountNames.some((name) => typeof point[name] === 'number' && Number.isFinite(point[name] as number)),
      )
      .map(({ index }) => index);

    if (observedIndexes.length === 0) {
      setBrushWindow({ startIndex: Math.max(0, chartData.length - 8), endIndex: chartData.length - 1 });
      return;
    }

    const lastObserved = observedIndexes[observedIndexes.length - 1];
    if (lastObserved == null) {
      setBrushWindow({ startIndex: Math.max(0, chartData.length - 8), endIndex: chartData.length - 1 });
      return;
    }

    const desiredWindowSize = Math.min(chartData.length, Math.max(5, Math.min(8, observedIndexes.length + 2)));
    const startIndex = Math.max(0, lastObserved - desiredWindowSize + 1);
    const endIndex = Math.min(chartData.length - 1, startIndex + desiredWindowSize - 1);
    setBrushWindow({ startIndex, endIndex });
  }, [chartData, accountNames]);

  const visibleNames = useMemo(
    () => accountNames.filter((name) => !hiddenNames.has(name)),
    [accountNames, hiddenNames],
  );

  const yDomain = useMemo<[number, number]>(() => {
    const values: number[] = [];
    chartData.forEach((point) => {
      visibleNames.forEach((name) => {
        const v = point[name];
        if (typeof v === 'number' && Number.isFinite(v)) values.push(v);
      });
    });
    if (values.length === 0) return [0, 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) {
      const padding = Math.max(Math.abs(max) * 0.08, metric === 'interactionRate' ? 0.01 : 1);
      return [Math.max(0, min - padding), max + padding];
    }

    const padding = (max - min) * 0.12;
    const lower = metric === 'traffic' ? Math.max(0, min - padding) : min - padding;
    return [lower, max + padding];
  }, [chartData, metric, visibleNames]);

  const formatter = metric === 'interactionRate' ? formatRate : formatNumber;
  const metricName = metric === 'interactionRate' ? '互动比' : trafficMode === 'daily' ? '单日增量' : '累计总量';
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const visiblePayload = payload.filter((entry: any) => !hiddenNames.has(String(entry.dataKey)));
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
        <div className="mb-1 font-medium text-gray-800">{label}</div>
        {visiblePayload.map((entry: any) => {
          const observed = entry.payload?.[`${entry.dataKey}__observed`];
          return (
            <div key={entry.dataKey} className="text-gray-600">
              {entry.name}：{entry.value == null ? '无可比采样' : formatter(Number(entry.value))}
              <span className="ml-1 text-gray-400">{observed ? metricName : '无采样'}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 text-sm">
      {payload?.map((entry: any) => {
        const name = String(entry.value);
        const isHidden = hiddenNames.has(name);
        return (
          <button
            key={name}
            type="button"
            onClick={() => {
              setHiddenNames((current) => {
                const next = new Set(current);
                if (next.has(name)) next.delete(name);
                else next.add(name);
                return next;
              });
            }}
            className={`inline-flex items-center gap-1.5 transition-colors ${
              isHidden ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: isHidden ? '#d1d5db' : entry.color }}
            />
            <span className={isHidden ? 'line-through' : ''}>{name}</span>
          </button>
        );
      })}
    </div>
  );

  if (chartData.length === 0 || accountNames.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <p className="text-sm">暂无可展示数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dateRange && observedDateCount > 0 && observedDateCount < 2 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          当前时间段仅有 {observedDateCount} 天真实采样，可用下方时间滑块缩放到采样附近查看。
        </div>
      )}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" minTickGap={24} />
          <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={formatter} domain={yDomain} />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {accountNames.map((name, index) => {
            const isHidden = hiddenNames.has(name);
            return (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={COLORS[index % COLORS.length]}
                strokeOpacity={isHidden ? 0 : 1}
                strokeWidth={2}
                dot={isHidden ? false : { r: 3 }}
                activeDot={isHidden ? false : { r: 5 }}
              connectNulls={false}
              />
            );
          })}
          {chartData.length > 1 && (
            <Brush
              dataKey="date"
              height={24}
              stroke="#94a3b8"
              travellerWidth={10}
              startIndex={brushWindow?.startIndex}
              endIndex={brushWindow?.endIndex}
              onChange={(next) => {
                if (
                  typeof next?.startIndex === 'number'
                  && typeof next?.endIndex === 'number'
                ) {
                  setBrushWindow({ startIndex: next.startIndex, endIndex: next.endIndex });
                }
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}