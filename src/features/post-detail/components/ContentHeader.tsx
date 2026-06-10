// ============================================================
// ContentHeader — 内容头部信息
// ============================================================

'use client';

import { Calendar, User, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ContentDetail } from '@/features/post-detail/hooks/useContentDetail';

const PLATFORM_LABELS: Record<string, string> = { zhihu: '知乎', bilibili: 'B站' };
const TYPE_LABELS: Record<string, string> = { answer: '回答', article: '文章', video: '视频' };

export default function ContentHeader({ content }: { content: ContentDetail }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <Link
        href="/contents"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        返回列表
      </Link>
      <h1 className="text-xl font-bold text-gray-900 mb-3">{content.title ?? '无标题'}</h1>
      <div className="flex items-center gap-3 flex-wrap text-sm text-gray-500">
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          {PLATFORM_LABELS[content.platform] ?? content.platform}
        </span>
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
          {TYPE_LABELS[content.content_type ?? ''] ?? content.content_type ?? '未知'}
        </span>
        <span className="flex items-center gap-1">
          <User size={14} />
          {content.account_name}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={14} />
          {content.publish_date ?? '--'}
        </span>
        {content.url && (
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-brand-500 hover:text-brand-600"
          >
            <ExternalLink size={14} />
            查看原文
          </a>
        )}
      </div>
    </div>
  );
}
