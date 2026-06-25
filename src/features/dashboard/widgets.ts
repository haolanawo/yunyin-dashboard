import { type ComponentType, lazy } from 'react';

export interface WidgetConfig {
  id: string;
  title: string;
  description?: string;
  grid: `col-span-${1|2|3|4|5|6|7|8|9|10|11|12}`;
  component: ComponentType;
  closeable?: boolean;
}

export const dashboardWidgets: WidgetConfig[] = [
  {
    id: 'summary-stats',
    title: '经营总览',
    description: '跨平台账号、内容、互动和效率指标',
    grid: 'col-span-12',
    component: lazy(() => import('./components/SummaryStats')),
  },
  {
    id: 'recent-data',
    title: '最新内容',
    description: '最近入库的跨平台内容',
    grid: 'col-span-6',
    component: lazy(() => import('./components/RecentData')),
  },
  {
    id: 'quick-actions',
    title: '运营入口',
    description: '常用经营看板入口',
    grid: 'col-span-6',
    component: lazy(() => import('./components/QuickActions')),
  },
];
