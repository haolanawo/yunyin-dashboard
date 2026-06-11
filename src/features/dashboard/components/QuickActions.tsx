import Link from 'next/link';
import { BarChart3, FileText, Settings, Tv, Users } from 'lucide-react';

const actions = [
  { label: '跨平台统计', path: '/analytics', icon: BarChart3, color: 'text-blue-500' },
  { label: '知乎内容', path: '/contents', icon: FileText, color: 'text-sky-500' },
  { label: 'B站视频', path: '/bilibili', icon: Tv, color: 'text-pink-500' },
  { label: '账号管理', path: '/accounts', icon: Users, color: 'text-emerald-500' },
  { label: '系统设置', path: '/settings', icon: Settings, color: 'text-gray-500' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.path}
          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
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
