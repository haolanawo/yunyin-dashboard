'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  FileText,
  PenTool,
  TrendingUp,
  Tv,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { key: 'dashboard', label: '首页', path: '/dashboard', icon: LayoutDashboard },
  { key: 'analytics', label: '统计分析', path: '/analytics', icon: BarChart3 },
  { key: 'contents', label: '内容管理', path: '/contents', icon: FileText },
  { key: 'bilibili', label: 'B站视频', path: '/bilibili', icon: Tv },
  { key: 'bilibili-analytics', label: 'B站分析', path: '/bilibili/analytics', icon: BarChart3 },
  { key: 'writing-guide', label: '写作指导', path: '/writing-guide', icon: PenTool },
  { key: 'trends', label: '趋势分析', path: '/trends', icon: TrendingUp },
  { key: 'accounts', label: '账号管理', path: '/accounts', icon: Users },
  { key: 'settings',  label: '系统设置', path: '/settings',  icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-sidebar-bg flex flex-col h-screen shrink-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
        <div className="w-7 h-7 rounded bg-brand-500 flex items-center justify-center text-white font-bold text-sm">Y</div>
        <span className="text-white font-semibold text-sm">yunyin</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.key}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 relative ${isActive ? 'bg-sidebar-active/10 text-white' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'}`}
            >
              {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-white/80 rounded-r-full" />}
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-3 border-t border-white/10 text-sidebar-text text-xs">v0.3.0</div>
    </aside>
  );
}
