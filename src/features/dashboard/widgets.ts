// ============================================================
// Widget 注册表 — 配置驱动的仪表盘卡片
//
// AI Agent 规则（严格遵守）：
//   1. 添加新 widget = 在此数组末尾追加一项
//   2. 不要删除或修改已有 widget 的 id/grid
//   3. 每个 widget 的 component 放在 features/<widget-name>/ 目录
//   4. grid 占位规则：整个面板 12 列，常用值：
//      col-span-3  = 1/4 宽（小卡片）
//      col-span-4  = 1/3 宽
//      col-span-6  = 1/2 宽（中卡片）
//      col-span-8  = 2/3 宽
//      col-span-12 = 全宽（大图表）
// ============================================================

import { type ComponentType, lazy } from 'react';

export interface WidgetConfig {
  /** 全局唯一标识，用于 key 和持久化 */
  id: string;
  /** 显示标题 */
  title: string;
  /** 描述，hover 时显示 */
  description?: string;
  /** Tailwind grid 占位类 */
  grid: `col-span-${1|2|3|4|5|6|7|8|9|10|11|12}`;
  /** 组件（支持懒加载） */
  component: ComponentType;
  /** 是否允许用户关闭此 widget */
  closeable?: boolean;
}

/**
 * 主面板 widget 列表
 * AI 新增 widget 时在此数组末尾 push
 */
export const dashboardWidgets: WidgetConfig[] = [
  {
    id: 'summary-stats',
    title: '核心指标',
    description: '关键业务数据汇总',
    grid: 'col-span-12',
    component: lazy(() => import('./components/SummaryStats')),
  },
  {
    id: 'recent-data',
    title: '最近数据',
    description: '最新入库的数据记录',
    grid: 'col-span-6',
    component: lazy(() => import('./components/RecentData')),
  },
  {
    id: 'quick-actions',
    title: '快捷操作',
    description: '常用功能入口',
    grid: 'col-span-6',
    component: lazy(() => import('./components/QuickActions')),
  },
];
