// ============================================================
// 系统设置页
// ============================================================

'use client';

import { Database, CheckCircle, XCircle, Loader2, Server, Globe } from 'lucide-react';
import { useSupabaseStatus, useTableCounts } from '@/features/settings/hooks/useConnectionStatus';

function StatusCard() {
  const { data, isLoading, isError } = useSupabaseStatus();

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Database size={18} className="text-brand-500" />
        <h2 className="text-base font-semibold text-gray-800">Supabase 连接状态</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 py-4">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">检测中...</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {data?.connected ? (
              <>
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm text-green-700">已连接</span>
              </>
            ) : (
              <>
                <XCircle size={16} className="text-red-500" />
                <span className="text-sm text-red-700">连接失败</span>
              </>
            )}
          </div>
          {data?.connected && (
            <div className="text-sm text-gray-600">
              延迟: <span className="font-medium text-gray-800">{data.latency}ms</span>
            </div>
          )}
          <div className="text-sm text-gray-600">
            项目 URL: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{data?.projectUrl ?? '--'}</code>
          </div>
          {data?.error && (
            <div className="text-xs text-red-500 bg-red-50 rounded p-2">
              {data.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TableInfoCard() {
  const { data, isLoading } = useTableCounts();

  const tableLabels: Record<string, string> = {
    zhihu_accounts: '知乎账号',
    contents: '内容数据',
    metrics_daily: '每日指标',
    structural_labels: '结构标签',
    writing_rules: '写作规则',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Server size={18} className="text-brand-500" />
        <h2 className="text-base font-semibold text-gray-800">数据库信息</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 text-xs font-medium text-gray-500">表名</th>
            <th className="text-right py-2 text-xs font-medium text-gray-500">记录数</th>
            <th className="text-right py-2 text-xs font-medium text-gray-500">状态</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={3} className="py-4 text-center text-gray-400">
                <Loader2 size={16} className="animate-spin inline mr-1" />
                加载中...
              </td>
            </tr>
          ) : (
            (data ?? []).map((t) => (
              <tr key={t.name} className="border-b border-gray-50">
                <td className="py-2.5 text-gray-700">{tableLabels[t.name] ?? t.name}</td>
                <td className="py-2.5 text-right font-medium text-gray-800">{t.count}</td>
                <td className="py-2.5 text-right">
                  {t.count > 0 ? (
                    <span className="text-green-600 text-xs">✓ 正常</span>
                  ) : (
                    <span className="text-yellow-600 text-xs">△ 空表</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function DeploymentCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe size={18} className="text-brand-500" />
        <h2 className="text-base font-semibold text-gray-800">部署信息</h2>
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        <div>
          框架: <span className="font-medium text-gray-800">Next.js 15 + React 19</span>
        </div>
        <div>
          样式: <span className="font-medium text-gray-800">Tailwind CSS 3.4</span>
        </div>
        <div>
          数据库: <span className="font-medium text-gray-800">Supabase PostgreSQL</span>
        </div>
        <div>
          部署: <span className="font-medium text-gray-800">Netlify</span>
        </div>
        <div>
          版本: <span className="font-medium text-gray-800">v0.2.0</span>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">系统设置</h1>
      <div className="grid grid-cols-2 gap-4">
        <StatusCard />
        <DeploymentCard />
        <div className="col-span-2">
          <TableInfoCard />
        </div>
      </div>
    </div>
  );
}
