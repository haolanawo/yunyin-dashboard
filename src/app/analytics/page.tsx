'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PlatformChart = dynamic(() => import('@/features/analytics/components/PlatformChart'));
const TrendChart = dynamic(() => import('@/features/analytics/components/TrendChart'));
const TopContentsTable = dynamic(() => import('@/features/analytics/components/TopContentsTable'));
const AccountComparison = dynamic(() => import('@/features/analytics/components/AccountComparison'));

function ChartCard({ title, children, wide = false }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-100 p-5 hover:shadow-sm transition-shadow ${wide ? 'xl:col-span-2' : ''}`}>
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

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">跨平台统计分析</h1>
      <p className="text-sm text-gray-500 mb-6">把知乎和B站放在同一张经营表里看内容资产、点赞结构和互动走势。</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="平台分布" wide>
            <PlatformChart />
          </ChartCard>
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="互动趋势">
            <TrendChart />
          </ChartCard>
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="高赞内容排行">
            <TopContentsTable />
          </ChartCard>
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="账号内容对比" wide>
            <AccountComparison />
          </ChartCard>
        </Suspense>
      </div>
    </div>
  );
}
