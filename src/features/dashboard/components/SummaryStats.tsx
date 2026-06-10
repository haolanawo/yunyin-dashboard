// ============================================================
// SummaryStats — 核心指标卡片
// 显示 4 个 KPI 数字卡片（总用户、活跃数、收入、增长率）
// 数据源：Supabase（待接入）
// ============================================================

import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

const stats = [
  { label: '总用户数', value: '--', change: '+0%', icon: Users,        color: 'text-blue-600' },
  { label: '活跃用户', value: '--', change: '+0%', icon: Activity,     color: 'text-green-600' },
  { label: '总收入',   value: '--', change: '+0%', icon: DollarSign,   color: 'text-yellow-600' },
  { label: '增长率',   value: '--', change: '+0%', icon: TrendingUp,   color: 'text-purple-600' },
];

export default function SummaryStats() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white border border-gray-100 rounded-lg p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{stat.label}</span>
            <stat.icon size={20} className={stat.color} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          <div className="text-xs text-gray-400 mt-1">{stat.change} 较上月</div>
        </div>
      ))}
    </div>
  );
}
