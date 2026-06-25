'use client';

import { Users } from 'lucide-react';
import type { AccountOption } from '@/features/trends/hooks/useTrends';

export default function AccountTrendSelector({
  accounts,
  selectedIds,
  onChange,
  dateRange,
  onDateRangeChange,
  period,
  onPeriodChange,
}: {
  accounts: AccountOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  period: 7 | 30 | 90;
  onPeriodChange: (days: 7 | 30 | 90) => void;
}) {
  const toggleAccount = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-gray-500">日期范围</label>
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => onPeriodChange(days as 7 | 30 | 90)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === days ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              过去{days}天
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dateRange.start}
          onChange={(event) => onDateRangeChange({ ...dateRange, start: event.target.value })}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
        />
        <span className="text-xs text-gray-400">至</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(event) => onDateRangeChange({ ...dateRange, end: event.target.value })}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => onChange(accounts.map((account) => account.account_id))}
          className="rounded px-2 py-1 text-xs text-brand-500 transition-colors hover:bg-brand-50"
        >
          全选
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          className="rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-50"
        >
          取消
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {accounts.map((account) => {
          const isSelected = selectedIds.includes(account.account_id);
          return (
            <button
              key={account.account_id}
              type="button"
              onClick={() => toggleAccount(account.account_id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users size={12} />
              {account.account_name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
