// ============================================================
// AccountTrendSelector — 账号选择 & 日期范围
// ============================================================

'use client';

import { useMemo } from 'react';
import { Users } from 'lucide-react';
import type { AccountOption } from '@/features/trends/hooks/useTrends';

export default function AccountTrendSelector({
  accounts,
  selectedIds,
  onChange,
  dateRange,
  onDateRangeChange,
}: {
  accounts: AccountOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
}) {
  const toggleAccount = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onChange(accounts.map((a) => a.account_id));
  };

  const deselectAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      {/* 日期范围 */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-500 w-16">日期范围</label>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
          className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
        />
        <span className="text-xs text-gray-400">至</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
          className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
        />
        <button
          onClick={selectAll}
          className="text-xs px-2 py-1 text-brand-500 hover:bg-brand-50 rounded transition-colors"
        >
          全选
        </button>
        <button
          onClick={deselectAll}
          className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-50 rounded transition-colors"
        >
          取消
        </button>
      </div>

      {/* 账号选择 */}
      <div className="flex items-center gap-2 flex-wrap">
        {accounts.map((acc) => {
          const isSelected = selectedIds.includes(acc.account_id);
          return (
            <button
              key={acc.account_id}
              onClick={() => toggleAccount(acc.account_id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users size={12} />
              {acc.account_name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
