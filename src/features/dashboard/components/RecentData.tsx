// ============================================================
// RecentData — 最近数据记录
// 数据源：Supabase（待接入）
// ============================================================

import { Clock } from 'lucide-react';

const mockData = [
  { id: 1, name: '数据接入中...', time: '--', status: 'pending' },
];

export default function RecentData() {
  return (
    <div className="space-y-3">
      {mockData.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
        >
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-gray-400" />
            <span className="text-sm text-gray-700">{item.name}</span>
          </div>
          <span className="text-xs text-gray-400">{item.time}</span>
        </div>
      ))}
      {mockData.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          暂无数据 — 连接 Supabase 后自动填充
        </p>
      )}
    </div>
  );
}
