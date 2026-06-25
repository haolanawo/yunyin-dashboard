import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { Sidebar, Header } from '@/components/layout';
import { Providers } from '@/components/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: '直觉向量内容运营聚合看板',
  description: '直觉向量内容运营聚合看板 — 知乎 + B站内容数据分析',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className={`${inter.className} flex h-screen overflow-hidden`}>
        <Providers>
          <Suspense fallback={<div className="w-60 shrink-0 bg-sidebar-bg" />}>
            <Sidebar />
          </Suspense>
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 overflow-auto bg-gray-50">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
