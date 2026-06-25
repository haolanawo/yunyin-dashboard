'use client';

import { useMemo, useState } from 'react';
import ContentFilters from '@/features/content-ranking/components/ContentFilters';
import ContentTable from '@/features/content-ranking/components/ContentTable';
import { useContentsList } from '@/features/content-ranking/hooks/useContents';

const PAGE_SIZE = 20;

export default function ContentsPage() {
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [contentType, setContentType] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, isError, error } = useContentsList({
    page,
    pageSize: PAGE_SIZE,
    search,
    platform,
    contentType,
  });

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const updatePlatform = (value: string) => {
    setPlatform(value);
    setPage(0);
  };

  const updateContentType = (value: string) => {
    setContentType(value);
    setPage(0);
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-bold text-gray-900">内容管理</h1>

      <div className="mb-4 rounded-lg border border-gray-100 bg-white p-4">
        <ContentFilters
          search={search}
          onSearchChange={updateSearch}
          platform={platform}
          onPlatformChange={updatePlatform}
          contentType={contentType}
          onContentTypeChange={updateContentType}
        />
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <span>共 {total.toLocaleString()} 条记录</span>
          {isFetching && !isLoading && <span>正在刷新当前页...</span>}
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-4">
        <ContentTable items={items} isLoading={isLoading} isError={isError} error={error} />
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
            disabled={page === 0}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((currentPage) => Math.min(totalPages - 1, currentPage + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
