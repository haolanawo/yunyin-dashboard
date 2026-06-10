// ============================================================
// 统计分析页 — 4 图表布局
// ============================================================

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PlatformChart = dynamic(() => import('@/features/analytics/components/PlatformChart'));
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
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-48 bg-gray-100 rounded" />
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">统计分析</h1>
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="平台内容分布">
            <PlatformChart />
          </ChartCard>
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="互动趋势">
            <TrendChart />
          </ChartCard>
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="高分内容排行">
            <TopContentsTable />
          </ChartCard>
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard title="账号内容对比">
            <AccountComparison />
          </ChartCard>
        </Suspense>
      </div>
    </div>
  );
}
