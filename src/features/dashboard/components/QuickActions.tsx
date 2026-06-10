// ============================================================
// QuickActions — 快捷操作入口
// 供用户快速跳转到常用功能
// ============================================================

import Link from 'next/link';
import { BarChart3, Database, FileText, Settings } from 'lucide-react';

const actions = [
  { label: '查看分析',  path: '/analytics', icon: BarChart3, color: 'text-blue-500' },
  { label: '数据导入',  path: '/settings',  icon: Database,  color: 'text-green-500' },
  { label: '生成报告',  path: '/settings',  icon: FileText,  color: 'text-purple-500' },
  { label: '系统配置',  path: '/settings',  icon: Settings,  color: 'text-gray-500' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.path}
          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100
            hover:border-gray-200 hover:shadow-sm transition-all group"
        >
          <action.icon size={18} className={action.color} />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
