'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, RefreshCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccountList, useAccountTrends, type TrendPlatform } from '@/features/trends/hooks/useTrends';
import AccountTrendSelector from '@/features/trends/components/AccountTrendSelector';
import TrendLineChart, { type TrendTrafficMode } from '@/features/trends/components/TrendLineChart';

type Period = 7 | 30 | 90;

function formatDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : date.toISOString().slice(0, 10);
}

function getDateRange(days: Period) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return {
    start: formatDateKey(start),
    end: formatDateKey(end),
  };
}

function parsePlatform(value: string | null): TrendPlatform {
  return value === 'bilibili' ? 'bilibili' : 'zhihu';
}

function TrendsPageContent() {
  const searchParams = useSearchParams();
  const platform = parsePlatform(searchParams.get('platform'));
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [period, setPeriod] = useState<Period>(7);
  const [dateRange, setDateRange] = useState(() => getDateRange(7));
  const [trafficMode, setTrafficMode] = useState<TrendTrafficMode>('daily');
  const { data: accountsPayload, isLoading: accountsLoading } = useAccountList(platform);
  const accounts = accountsPayload?.data ?? [];
  const {
    data: trendsPayload,
    isLoading,
    isError,
    error,
  } = useAccountTrends(platform, selectedIds, dateRange);
  const trends = trendsPayload?.data ?? [];

  useEffect(() => {
    setSelectedIds([]);
  }, [platform]);

  useEffect(() => {
    if (accounts.length > 0 && selectedIds.length === 0) {
      setSelectedIds(accounts.map((account) => account.account_id));
    }
  }, [accounts, selectedIds.length]);

  const hasTraffic = useMemo(() => trends.some((item) => item.traffic > 0), [trends]);
  const hasInteractionRate = useMemo(() => trends.some((item) => item.interactionRate > 0), [trends]);
  const hasObservation = useMemo(() => trends.some((item) => item.hasObservation), [trends]);
  // 只有一个观测日时，日增量算不出来（需要前一日做基准），自动回退到累计
  const observedDates = useMemo(
    () => [...new Set(trends.filter((t) => t.hasObservation).map((t) => t.date))].sort(),
    [trends],
  );
  const singleObservedDate = observedDates.length <= 1 && hasObservation;
  const effectiveTrafficMode = trafficMode === 'daily' && singleObservedDate ? 'cumulative' : trafficMode;

  const changePeriod = (days: Period) => {
    setPeriod(days);
    setDateRange(getDateRange(days));
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetch(`/api/trends/accounts?platform=${platform}&refresh=1`, { cache: 'no-store' }),
      fetch(
        `/api/trends/series?platform=${platform}&start=${dateRange.start}&end=${dateRange.end}${selectedIds.map((id) => `&accountId=${encodeURIComponent(id)}`).join('')}&refresh=1`,
        { cache: 'no-store' },
      ),
    ]);
    await queryClient.invalidateQueries({ queryKey: ['account-list', platform] });
    await queryClient.invalidateQueries({ queryKey: ['account-trends'] });
  };

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-bold text-gray-900">趋势分析</h1>
      <p className="mb-6 text-sm text-gray-500">
        B站看播放量和互动率；知乎看赞同+评论总量，以及评论在互动中的占比。
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 text-xs text-gray-500">
        <div>
          缓存生成时间：{trendsPayload?.generatedAt ? new Date(trendsPayload.generatedAt).toLocaleString('zh-CN') : '尚未生成'}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCcw size={14} />
          刷新数据
        </button>
      </div>

      <div className="mb-6 rounded-lg border border-gray-100 bg-white p-4">
        {accountsLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            加载账号列表...
          </div>
        ) : (
          <AccountTrendSelector
            accounts={accounts}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            period={period}
            onPeriodChange={changePeriod}
          />
        )}
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center gap-2 rounded-lg border border-gray-100 bg-white text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">加载趋势数据...</span>
        </div>
      )}

      {isError && (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-gray-100 bg-white text-gray-400">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-sm">数据加载失败</p>
          <p className="text-xs">{error?.message ?? '未知错误'}</p>
        </div>
      )}

      {!isLoading && !isError && selectedIds.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-400">
          <p className="text-sm">请至少选择一个账号</p>
        </div>
      )}

      {!isLoading && !isError && selectedIds.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {!hasObservation && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              该时间段没有真实采样数据，因此不会绘制伪造的 0 线或连续走势。
            </div>
          )}
          <div className="rounded-lg border border-gray-100 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-700">
                {platform === 'bilibili' ? '播放量趋势' : '互动总量趋势'}
              </h3>
              <div className="inline-flex rounded-lg bg-gray-100 p-1">
                {[
                  { value: 'daily', label: '单日增量' },
                  { value: 'cumulative', label: '历史累计' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTrafficMode(item.value as TrendTrafficMode)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      trafficMode === item.value
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            {trafficMode === 'daily' && singleObservedDate && hasObservation && (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                当前仅有 1 天数据，日增量无法计算（需要前一日做基线），先回退显示历史累计。
              </div>
            )}
            {hasTraffic ? (
              <TrendLineChart trends={trends} metric="traffic" trafficMode={effectiveTrafficMode} dateRange={dateRange} />
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-400">
                <p className="text-sm">{platform === 'bilibili' ? '暂无播放量快照' : '暂无互动量快照'}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">
              {platform === 'bilibili' ? '互动率趋势' : '评论占比趋势'}
            </h3>
            {hasInteractionRate ? (
              <TrendLineChart trends={trends} metric="interactionRate" dateRange={dateRange} />
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-400">
                <p className="text-sm">暂无可计算互动比的数据</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrendsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">加载趋势数据...</span>
        </div>
      }
    >
      <TrendsPageContent />
    </Suspense>
  );
}