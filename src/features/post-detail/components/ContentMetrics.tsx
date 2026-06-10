// ============================================================
// ContentMetrics — 互动指标迷你趋势
// ============================================================

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { useContentMetrics } from '@/features/post-detail/hooks/useContentDetail';

interface ContentMetricsProps {
  contentId: string;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse h-48 bg-gray-100 rounded" />
  );
}

export default function ContentMetrics({ contentId }: ContentMetricsProps) {
  const { data, isLoading, isError, error } = useContentMetrics(contentId);

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
        <AlertCircle size={16} className="text-red-400" />
        <p className="text-xs">指标加载失败: {error?.message}</p>
      </div>
    );
  }

  const metrics = data ?? [];

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-1">互动趋势</h2>
      <p className="text-xs text-gray-400 mb-4">点赞数与评论数变化</p>

      {metrics.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <p className="text-sm">暂无互动数据</p>
        </div>
      ) : metrics.length === 1 ? (
        <div className="flex items-center gap-8 py-4">
          <div>
            <div className="text-xs text-gray-500">点赞</div>
            <div className="text-lg font-bold text-blue-600">{metrics[0]!.votes}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">评论</div>
            <div className="text-lg font-bold text-purple-600">{metrics[0]!.comments}</div>
          </div>
          <div className="text-xs text-gray-400">{metrics[0]!.snapshot_date}</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="snapshot_date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="votes"
              name="点赞"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
            <Line
              type="monotone"
              dataKey="comments"
              name="评论"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
