'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const TrendChart = dynamic(() => import('@/features/analytics/components/TrendChart'));
const TopContentsTable = dynamic(() => import('@/features/analytics/components/TopContentsTable'));
const AccountComparison = dynamic(() => import('@/features/analytics/components/AccountComparison'));

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
      <div className="h-4 rounded bg-gray-200 w-1/3 mb-4" />
      <div className="h-56 rounded bg-gray-100" />
    </div>
  );
}

export default function ZhihuAnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">知乎分析</h1>
      <p className="text-sm text-gray-500 mb-6">聚焦知乎内容的点赞、评论和账号产出表现。</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="知乎互动趋势">
            <TrendChart defaultPlatform="zhihu" />
          </ChartCard>
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="知乎高赞内容">
            <TopContentsTable />
          </ChartCard>
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <div className="xl:col-span-2">
            <ChartCard title="知乎账号产出对比">
              <AccountComparison />
            </ChartCard>
          </div>
        </Suspense>
      </div>
    </div>
  );
}
