'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Tv,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface NavLink {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

interface NavGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  items: NavLink[];
}

const topLinks: NavLink[] = [
  { key: 'dashboard', label: '首页总览', path: '/dashboard', icon: LayoutDashboard },
  { key: 'analytics', label: '跨平台统计', path: '/analytics', icon: BarChart3 },
  { key: 'accounts', label: '账号管理', path: '/accounts', icon: Users },
];

const platformGroups: NavGroup[] = [
  {
    key: 'zhihu',
    label: '知乎',
    icon: FileText,
    items: [
      { key: 'zhihu-contents', label: '内容管理', path: '/contents', icon: FileText },
      { key: 'zhihu-analytics', label: '数据分析', path: '/zhihu/analytics', icon: BarChart3 },
      { key: 'zhihu-trends', label: '趋势分析', path: '/trends?platform=zhihu', icon: TrendingUp },
    ],
  },
  {
    key: 'bilibili',
    label: 'B站',
    icon: Tv,
    items: [
      { key: 'bilibili-contents', label: '内容管理', path: '/bilibili', icon: FileText },
      { key: 'bilibili-analytics', label: '数据分析', path: '/bilibili/analytics', icon: BarChart3 },
      { key: 'bilibili-trends', label: '趋势分析', path: '/trends?platform=bilibili', icon: TrendingUp },
    ],
  },
];

const bottomLinks: NavLink[] = [
  { key: 'settings', label: '系统设置', path: '/settings', icon: Settings },
];

function isActivePath(pathname: string, path: string) {
  const [basePath] = path.split('?');
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function NavItem({ item, pathname, nested = false }: { item: NavLink; pathname: string; nested?: boolean }) {
  const isActive = isActivePath(pathname, item.path);
  return (
    <Link
      href={item.path}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 relative ${
        nested ? 'ml-3' : ''
      } ${isActive ? 'bg-sidebar-active/10 text-white' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'}`}
    >
      {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-white/80 rounded-r-full" />}
      <item.icon size={17} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function PlatformGroup({ group, pathname }: { group: NavGroup; pathname: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-sidebar-text/80">
        <span className="flex items-center gap-2">
          <group.icon size={15} />
          {group.label}
        </span>
        <ChevronDown size={14} />
      </div>
      <div className="space-y-1">
        {group.items.map((item) => (
          <NavItem key={item.key} item={item} pathname={pathname} nested />
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-sidebar-bg flex flex-col h-screen shrink-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
        <div className="w-7 h-7 rounded bg-brand-500 flex items-center justify-center text-white font-bold text-sm">V</div>
        <span className="text-white font-semibold text-sm truncate">直觉向量看板</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto">
        <div className="space-y-1">
          {topLinks.map((item) => (
            <NavItem key={item.key} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="pt-2 border-t border-white/10 space-y-2">
          {platformGroups.map((group) => (
            <PlatformGroup key={group.key} group={group} pathname={pathname} />
          ))}
        </div>

        <div className="pt-2 border-t border-white/10 space-y-1">
          {bottomLinks.map((item) => (
            <NavItem key={item.key} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>
      <div className="px-5 py-3 border-t border-white/10 text-sidebar-text text-xs">v0.4.0</div>
    </aside>
  );
}
