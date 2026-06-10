// ============================================================
// Dashboard 主页 — 渲染 Widget 注册表中的所有卡片
//
// AI Agent 规则：
//   添加 widget 不需要修改此文件！
//   只需在 src/features/dashboard/widgets.ts 数组末尾追加即可
// ============================================================

'use client';

import { Suspense } from 'react';
import { dashboardWidgets } from '@/features/dashboard';

function WidgetSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      {dashboardWidgets.map((widget) => (
        <div key={widget.id} className={widget.grid}>
          <Suspense fallback={<WidgetSkeleton />}>
            <widget.component />
          </Suspense>
        </div>
      ))}
    </>
  );
}
