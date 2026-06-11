'use client';

import { useState } from 'react';
import { AlertCircle, ExternalLink, Play } from 'lucide-react';
import type { BilibiliVideo } from '@/features/bilibili/hooks/useBilibiliVideos';

// -------------------- Helpers --------------------

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return '--';
  if (n >= 1_0000_0000) return (n / 1_0000_0000).toFixed(1) + '亿';
  if (n >= 1_0000) return (n / 1_0000).toFixed(1) + '万';
  return n.toLocaleString('zh-CN');
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function extractBvid(item: BilibiliVideo): string | null {
  if (item.content_url) {
    const match: RegExpMatchArray | null = item.content_url.match(/\/video\/([A-Za-z0-9]+)/);
    if (match && match[1]) return match[1];
  }
  if (item.content_id && /^BV/i.test(item.content_id)) return item.content_id;
  return null;
}

// -------------------- Cover Image --------------------

function CoverImage({ src, title }: { src: string | null; title: string | null }) {
  const [failed, setFailed] = useState(false);
  const storageBase = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bilibili-covers`
    : '';
  const jpgSrc = src ? `${storageBase}/${src}.jpg` : null;
  const svgSrc = src ? `${storageBase}/${src}.svg` : null;
  const [variant, setVariant] = useState<'jpg' | 'svg'>('jpg');
  const activeSrc = variant === 'jpg' ? jpgSrc : svgSrc;

  if (!activeSrc || failed) {
    return (
      <div className="w-[120px] h-[68px] rounded bg-gray-100 flex items-center justify-center shrink-0">
        <Play size={16} className="text-gray-300" />
      </div>
    );
  }

  return (
    <img
      src={activeSrc}
      alt={title ?? ''}
      className="w-[120px] h-[68px] rounded object-cover shrink-0 bg-gray-100"
      onError={() => {
        if (variant === 'jpg' && svgSrc) {
          setVariant('svg');
          return;
        }
        setFailed(true);
      }}
      loading="lazy"
    />
  );
}

// -------------------- Skeleton --------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-3 border-b border-gray-50">
          <div className="skeleton-shimmer w-[120px] h-[68px] rounded shrink-0" />
          <div className="flex-1 min-w-0">
            <div className={`skeleton-shimmer h-4 rounded ${['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-3/5'][i - 1]}`} />
          </div>
          <div className="skeleton-shimmer h-4 w-16 rounded" />
          <div className="skeleton-shimmer h-4 w-20 rounded" />
          <div className="skeleton-shimmer h-4 w-16 rounded" />
          <div className="skeleton-shimmer h-4 w-14 rounded" />
          <div className="skeleton-shimmer h-4 w-14 rounded" />
          <div className="skeleton-shimmer h-4 w-14 rounded" />
          <div className="skeleton-shimmer h-4 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

// -------------------- Props --------------------

interface BilibiliVideoTableProps {
  videos: BilibiliVideo[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

// -------------------- Component --------------------

export default function BilibiliVideoTable({ videos, isLoading, isError, error }: BilibiliVideoTableProps) {
  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
        <AlertCircle size={24} className="text-red-400" />
        <p className="text-sm">数据加载失败</p>
        <p className="text-xs">{error?.message}</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
        <Play size={24} className="text-gray-300" />
        <p className="text-sm">暂无数据</p>
        <p className="text-xs">B站视频数据还没有导入，请先运行数据导入脚本</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">封面</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">标题</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">UP主</th>
            <th className="text-right py-3 px-2 text-xs font-medium text-gray-500">播放量</th>
            <th className="text-right py-3 px-2 text-xs font-medium text-gray-500">点赞</th>
            <th className="text-right py-3 px-2 text-xs font-medium text-gray-500">收藏</th>
            <th className="text-right py-3 px-2 text-xs font-medium text-gray-500">投币</th>
            <th className="text-right py-3 px-2 text-xs font-medium text-gray-500">分享</th>
            <th className="text-right py-3 px-2 text-xs font-medium text-gray-500">评论</th>
            <th className="text-right py-3 px-2 text-xs font-medium text-gray-500">发布日期</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => {
            const bvid = extractBvid(video);
            const videoUrl = bvid ? `https://www.bilibili.com/video/${bvid}` : null;

            return (
              <tr
                key={video.content_id}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td className="py-3 px-2">
                  <div className="relative">
                    <CoverImage src={video.content_id} title={video.title} />
                  </div>
                </td>
                <td className="py-3 px-2 max-w-[320px]">
                  {videoUrl ? (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-800 hover:text-blue-600 line-clamp-2 font-medium inline-flex items-start gap-1 group"
                    >
                      <span>{video.title ?? '(无标题)'}</span>
                      <ExternalLink size={12} className="mt-0.5 text-gray-300 group-hover:text-blue-500 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-gray-800 line-clamp-2 font-medium">
                      {video.title ?? '(无标题)'}
                    </span>
                  )}
                </td>
                <td className="py-3 px-2 text-gray-600 whitespace-nowrap">
                  {video.account_name ?? '--'}
                </td>
                <td className="py-3 px-2 text-right text-gray-700 whitespace-nowrap tabular-nums">
                  {formatNumber(video.play_count)}
                </td>
                <td className="py-3 px-2 text-right text-gray-700 whitespace-nowrap tabular-nums">
                  {formatNumber(video.like_count)}
                </td>
                <td className="py-3 px-2 text-right text-gray-700 whitespace-nowrap tabular-nums">
                  {formatNumber(video.favorite_count)}
                </td>
                <td className="py-3 px-2 text-right text-gray-400 whitespace-nowrap tabular-nums">
                  --
                </td>
                <td className="py-3 px-2 text-right text-gray-700 whitespace-nowrap tabular-nums">
                  {formatNumber(video.share_count)}
                </td>
                <td className="py-3 px-2 text-right text-gray-700 whitespace-nowrap tabular-nums">
                  {formatNumber(video.reply_count)}
                </td>
                <td className="py-3 px-2 text-right text-gray-500 whitespace-nowrap">
                  {video.publish_date ?? '--'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
