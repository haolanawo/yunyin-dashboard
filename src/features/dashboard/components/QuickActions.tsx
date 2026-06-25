import Link from 'next/link';
import { BarChart3, FileText, Settings, Sparkles, Tv, Users } from 'lucide-react';

const actions = [
  { label: '跨平台统计', path: '/analytics', icon: BarChart3, color: 'text-blue-500' },
  { label: 'AI 图表', path: '/ai-dashboard', icon: Sparkles, color: 'text-violet-500' },
  { label: '知乎内容池', path: '/contents', icon: FileText, color: 'text-sky-500' },
  { label: 'B站视频池', path: '/bilibili', icon: Tv, color: 'text-pink-500' },
  { label: '账号产出', path: '/accounts', icon: Users, color: 'text-emerald-500' },
  { label: '数据连接', path: '/settings', icon: Settings, color: 'text-gray-500' },
];

export default function QuickActions() {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">运营入口</h3>
        <span className="text-xs text-gray-500">从总览下钻到具体问题</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.path}
            className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition-all hover:border-gray-200 hover:shadow-sm"
          >
            <action.icon size={18} className={action.color} />
            <span className="text-sm text-gray-700">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
