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
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索标题..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-56 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <select
        value={platform}
        onChange={(event) => onPlatformChange(event.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="">全部平台</option>
        <option value="zhihu">知乎</option>
        <option value="bilibili">B站</option>
      </select>

      <select
        value={contentType}
        onChange={(event) => onContentTypeChange(event.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="">全部类型</option>
        <option value="answer">回答</option>
        <option value="article">文章</option>
        <option value="video">视频</option>
      </select>
    </div>
  );
}
