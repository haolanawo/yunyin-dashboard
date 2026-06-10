// ============================================================
// Card — 数据面板的基础容器
// 用途：包裹每个 widget，统一视觉样式
// 规则：所有 widget 必须用 Card 包裹，不要自己写 border/rounded
// ============================================================

import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  /** grid 占位数，如 "col-span-3" */
  className?: string;
  /** 卡片标题 */
  title?: string;
  /** 右上角操作区 */
  actions?: ReactNode;
}

export function Card({ children, className = '', title, actions }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
