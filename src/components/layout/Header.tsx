// ============================================================
// Header — 全局顶栏
// AI Agent 规则：如需加全局按钮（通知、用户菜单等），在此文件添加
// 禁止在各个 feature 中自己写顶栏元素
// ============================================================

'use client';

import { Bell, User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
      {/* 左侧面包屑 — 未来可扩展 */}
      <div className="text-sm text-gray-500">
        {/* Breadcrumb slot */}
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell size={18} />
        </button>
        <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
