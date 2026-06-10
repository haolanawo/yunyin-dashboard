// ============================================================
// ContentFilters — 搜索 + 平台/类型筛选
// ============================================================

'use client';

import { Search } from 'lucide-react';

interface ContentFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  platform: string;
  onPlatformChange: (v: string) => void;
  contentType: string;
  onContentTypeChange: (v: string) => void;
}

export default function ContentFilters({
  search,
  onSearchChange,
  platform,
  onPlatformChange,
  contentType,
  onContentTypeChange,
}: ContentFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* 搜索框 */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索标题..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-56
            focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
            placeholder:text-gray-400"
        />
      </div>

      {/* 平台筛选 */}
      <select
        value={platform}
        onChange={(e) => onPlatformChange(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white
          focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="">全部平台</option>
        <option value="zhihu">知乎</option>
        <option value="bilibili">B站</option>
      </select>

      {/* 类型筛选 */}
      <select
        value={contentType}
        onChange={(e) => onContentTypeChange(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white
          focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="">全部类型</option>
        <option value="answer">回答</option>
        <option value="article">文章</option>
        <option value="video">视频</option>
      </select>
    </div>
  );
}
