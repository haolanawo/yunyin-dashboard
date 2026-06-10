// ============================================================
// Providers — 全局 Provider 包裹层
// 包含 React Query、未来可扩展其他 Provider
// ============================================================

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            refetchOnWindowFocus: true,
            refetchInterval: 5 * 60 * 1000, // 每 5 分钟自动刷新，无需手动点
            staleTime: 4 * 60 * 1000,        // 4 分钟后数据变陈旧
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
