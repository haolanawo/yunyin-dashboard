// ============================================================
// 内容管理页
// ============================================================

'use client';

import { useState, useMemo } from 'react';
import ContentFilters from '@/features/content-ranking/components/ContentFilters';
import ContentTable from '@/features/content-ranking/components/ContentTable';
import { useContentsList } from '@/features/content-ranking/hooks/useContents';

const PAGE_SIZE = 20;

export default function ContentsPage() {
  const { data: allItems, isLoading, isError, error } = useContentsList();
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [contentType, setContentType] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let items = allItems ?? [];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((c) => (c.title ?? '').toLowerCase().includes(q));
    }
    if (platform) {
      items = items.filter((c) => c.platform === platform);
    }
    if (contentType) {
      items = items.filter((c) => c.content_type === contentType);
    }
    return items;
  }, [allItems, search, platform, contentType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">内容管理</h1>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 mb-4">
        <ContentFilters
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(0); }}
          platform={platform}
          onPlatformChange={(v) => { setPlatform(v); setPage(0); }}
          contentType={contentType}
          onContentTypeChange={(v) => { setContentType(v); setPage(0); }}
        />
        <div className="text-xs text-gray-400 mt-3">
          共 {filtered.length} 条记录
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <ContentTable
          items={pageItems}
          isLoading={isLoading}
          isError={isError}
          error={error}
        />
      </div>

      {/* 分页 */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40
              hover:bg-gray-50 transition-colors"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40
              hover:bg-gray-50 transition-colors"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
