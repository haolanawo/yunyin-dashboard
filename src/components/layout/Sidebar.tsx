// ============================================================
// Sidebar — 全局侧边栏导航
// AI Agent 规则：
//   添加新页面 = 在此文件的 navItems 数组末尾追加一项
//   不要改已有项的 key/path，不要调整顺序
// ============================================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

/** 导航项注册表 — AI 加页面时在此数组末尾追加 */
export const navItems: NavItem[] = [
  { key: 'dashboard', label: '数据总览', path: '/dashboard', icon: LayoutDashboard },
  { key: 'analytics', label: '统计分析', path: '/analytics', icon: BarChart3 },
  { key: 'settings',  label: '系统设置', path: '/settings',  icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-sidebar-bg flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
        <div className="w-7 h-7 rounded bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
          Y
        </div>
        <span className="text-white font-semibold text-sm">云音分析</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.key}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                ${isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10 text-sidebar-text text-xs">
        v0.1.0
      </div>
    </aside>
  );
}
