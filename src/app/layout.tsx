// ============================================================
// 根布局 — 全局框架（侧边栏 + 顶栏 + 内容插槽）
//
// AI Agent 规则：
//   1. 此文件定义的是全局框架，不要在此文件中写业务逻辑
//   2. 该用插槽({children})时不要自行组合
//   3. 需要全局 Provider（如 React Query、Auth）时在此包裹
// ============================================================

import type { Metadata } from 'next';
import { Sidebar, Header } from '@/components/layout';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: '云音分析 — 数据面板',
  description: 'AI 驱动的数据分析面板',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="flex h-screen overflow-hidden">
        <Providers>
          {/* 侧边栏 — 固定宽度 */}
          <Sidebar />

          {/* 右侧内容区 */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* 顶栏 */}
            <Header />

            {/* 页面内容插槽 — 各子页面在此渲染 */}
            <main className="flex-1 overflow-auto bg-gray-50">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
