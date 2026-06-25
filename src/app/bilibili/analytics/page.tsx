// ============================================================
// B站分析页 — UP主数据对比图表
// ============================================================

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3 } from 'lucide-react';

const VideoCountChart = dynamic(
  () => import('@/features/bilibili-analytics/components/VideoCountChart'),
  { loading: () => <ChartSkeleton /> },
);
const ViewRankingChart = dynamic(
  () => import('@/features/bilibili-analytics/components/ViewRankingChart'),
  { loading: () => <ChartSkeleton /> },
);
const InteractionChart = dynamic(
  () => import('@/features/bilibili-analytics/components/InteractionChart'),
  { loading: () => <ChartSkeleton /> },
);

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  const barHeights = ['h-[85%]', 'h-[55%]', 'h-[70%]', 'h-[40%]', 'h-[90%]', 'h-[60%]', 'h-[75%]', 'h-[50%]'];
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <div className="skeleton-shimmer h-4 rounded w-1/3 mb-4" />
      <div className="h-48 flex items-end gap-3 px-4">
        {barHeights.map((h, i) => (
          <div key={i} className={`flex-1 skeleton-shimmer rounded-t ${h}`} />
        ))}
      </div>
    </div>
  );
}

export default function BilibiliAnalyticsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 size={20} className="text-pink-500" />
        <h1 className="text-xl font-bold text-gray-900">B站分析</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="UP主视频数对比">
            <VideoCountChart />
          </ChartCard>
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="UP主总播放量排名">
            <ViewRankingChart />
          </ChartCard>
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="UP主互动比排行（互动总量/播放量）">
            <InteractionChart />
          </ChartCard>
        </Suspense>
      </div>
    </div>
  );
}
