// ============================================================
// 写作指导页
// ============================================================

'use client';

import { useMemo } from 'react';
import { Loader2, AlertCircle, Lightbulb, TrendingUp, Shield } from 'lucide-react';
import { useWritingRules } from '@/features/writing-guide/hooks/useWritingRules';
import CategorySection from '@/features/writing-guide/components/CategorySection';

function LoadingView() {
  return (
    <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
      <Loader2 size={24} className="animate-spin" />
      <span>加载中...</span>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
      <AlertCircle size={32} className="text-red-400" />
      <p className="text-sm">数据加载失败</p>
      <p className="text-xs">{message}</p>
    </div>
  );
}

function EmptyView() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
      <Lightbulb size={32} />
      <p className="text-sm">暂无写作规则</p>
      <p className="text-xs">请先导入 SHAP 分析数据</p>
    </div>
  );
}

export default function WritingGuidePage() {
  const { data: rules, isLoading, isError, error } = useWritingRules();

  const grouped = useMemo(() => {
    if (!rules) return [];
    const map = new Map<string, typeof rules>();
    rules.forEach((r) => {
      const cat = r.category ?? '其他';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    });
    return Array.from(map.entries());
  }, [rules]);

  const strongCount = rules?.filter((r) => r.evidence_level === 'strong').length ?? 0;
  const moderateCount = rules?.filter((r) => r.evidence_level === 'moderate').length ?? 0;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">写作指导</h1>
      <p className="text-sm text-gray-500 mb-6">基于 SHAP 分析的 AI 写作优化建议</p>

      {isLoading && <LoadingView />}
      {isError && <ErrorView message={error?.message ?? '未知错误'} />}
      {!isLoading && !isError && (!rules || rules.length === 0) && <EmptyView />}

      {!isLoading && !isError && rules && rules.length > 0 && (
        <>
          {/* 统计条 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-3">
              <Lightbulb size={20} className="text-brand-500" />
              <div>
                <div className="text-lg font-bold text-gray-900">{rules.length}</div>
                <div className="text-xs text-gray-500">规则总数</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-3">
              <Shield size={20} className="text-green-500" />
              <div>
                <div className="text-lg font-bold text-gray-900">{strongCount}</div>
                <div className="text-xs text-gray-500">强证据</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-3">
              <TrendingUp size={20} className="text-yellow-500" />
              <div>
                <div className="text-lg font-bold text-gray-900">{moderateCount}</div>
                <div className="text-xs text-gray-500">中等证据</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-3">
              <div className="text-lg font-bold text-gray-900">{grouped.length}</div>
              <div className="text-xs text-gray-500">分类数</div>
            </div>
          </div>

          {/* 信息横幅 */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              💡 以下规则由 SHAP 特征重要性分析自动生成，用于指导内容创作优化。
              证据强度基于 SHAP 值的平均绝对值：强（&gt; 0.001）、中（&gt; 0.0001）、弱（≤ 0.0001）。
            </p>
          </div>

          {/* 规则列表 */}
          <div className="space-y-8">
            {grouped.map(([category, items]) => (
              <CategorySection key={category} category={category} rules={items} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
