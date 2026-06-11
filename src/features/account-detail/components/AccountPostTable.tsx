// ============================================================
// AccountPostTable — 账号帖子列表
// ============================================================

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThumbsUp, MessageSquare, Calendar, ArrowUpDown } from 'lucide-react';
import type { AccountPost } from '@/features/account-detail/hooks/useAccountDetail';

const PAGE_SIZE = 20;

type SortKey = 'publish_date' | 'votes';
type SortDir = 'asc' | 'desc';

const TYPE_LABELS: Record<string, string> = { answer: '回答', article: '文章', video: '视频' };

export default function AccountPostTable({ posts }: { posts: AccountPost[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('publish_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const items = [...posts];
    items.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'publish_date') {
        const da = a.publish_date ?? '';
        const db = b.publish_date ?? '';
        cmp = da.localeCompare(db);
      } else {
        cmp = (a.votes ?? 0) - (b.votes ?? 0);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return items;
  }, [posts, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-8 text-center text-gray-400 text-sm">
        该账号暂无帖子
      </div>
    );
  }

  return (
    <div>
      {/* 排序控制 */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
        <span className="text-gray-400">排序：</span>
        <button
          onClick={() => toggleSort('publish_date')}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            sortKey === 'publish_date' ? 'bg-brand-50 text-brand-600 font-medium' : 'hover:text-gray-700'
          }`}
        >
          <Calendar size={14} />
          时间
          {sortKey === 'publish_date' && <ArrowUpDown size={12} />}
        </button>
        <button
          onClick={() => toggleSort('votes')}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            sortKey === 'votes' ? 'bg-brand-50 text-brand-600 font-medium' : 'hover:text-gray-700'
          }`}
        >
          <ThumbsUp size={14} />
          点赞
          {sortKey === 'votes' && <ArrowUpDown size={12} />}
        </button>
        <span className="ml-auto">{sorted.length} 篇帖子</span>
      </div>

      {/* 列表 */}
      <div className="space-y-2">
        {pageItems.map((post) => (
          <Link
            key={post.content_id}
            href={`/content/${post.content_id}`}
            className="block bg-white border border-gray-100 rounded-lg p-4 hover:shadow-sm hover:border-gray-200 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{post.title ?? '无标题'}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                    {post.platform}
                  </span>
                  {post.content_type && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {TYPE_LABELS[post.content_type] ?? post.content_type}
                    </span>
                  )}
                  {post.publish_date && (
                    <span className="text-xs text-gray-400">{post.publish_date}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <ThumbsUp size={14} className="text-yellow-500" />
                  {post.votes}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MessageSquare size={14} className="text-blue-400" />
                  {post.comments}
                </div>
                {post.ai_score !== null && (
                  <div className="text-xs font-medium text-purple-600">
                    {post.ai_score.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 分页 */}
      {sorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
