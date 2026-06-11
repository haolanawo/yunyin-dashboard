// ============================================================
// 趋势分析页
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAccountList, useAccountTrends } from '@/features/trends/hooks/useTrends';
import AccountTrendSelector from '@/features/trends/components/AccountTrendSelector';
import TrendLineChart from '@/features/trends/components/TrendLineChart';

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function TrendsPage() {
  const { data: accounts = [], isLoading: accountsLoading } = useAccountList();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [metric, setMetric] = useState<'votes' | 'comments'>('votes');

  const { data: trends, isLoading, isError, error } = useAccountTrends(selectedIds, dateRange);

  // Auto-select all accounts when they first load
  useEffect(() => {
    if (accounts.length > 0 && selectedIds.length === 0) {
      setSelectedIds(accounts.map((a) => a.account_id));
    }
  }, [accounts, selectedIds.length]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">趋势分析</h1>
      <p className="text-sm text-gray-500 mb-6">按时间维度查看各账号指标变化趋势</p>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6">
        {accountsLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
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
          />
        )}

        {/* 指标切换 */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
          <span className="text-xs text-gray-500">指标：</span>
          <button
            onClick={() => setMetric('votes')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              metric === 'votes'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            点赞数
          </button>
          <button
            onClick={() => setMetric('comments')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              metric === 'comments'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            评论数
          </button>
        </div>
      </div>

      {/* 图表 */}
      <div className="bg-white rounded-lg border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {metric === 'votes' ? '点赞趋势' : '评论趋势'}
        </h3>

        {isLoading && (
          <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">加载趋势数据...</span>
          </div>
        )}
        {isError && (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-400">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-sm">数据加载失败</p>
            <p className="text-xs">{error?.message}</p>
          </div>
        )}
        {!isLoading && !isError && selectedIds.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <p className="text-sm">请至少选择一个账号</p>
          </div>
        )}
        {!isLoading && !isError && selectedIds.length > 0 && (
          <TrendLineChart trends={trends ?? []} metric={metric} />
        )}
      </div>
    </div>
  );
}
