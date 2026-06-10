// ============================================================
// RuleCard — 单条写作规则卡片
// ============================================================

'use client';

import { Lightbulb, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import type { WritingRule } from '@/features/writing-guide/hooks/useWritingRules';

const EVIDENCE_CONFIG: Record<string, { icon: typeof Lightbulb; color: string; label: string; bg: string }> = {
  strong: { icon: Shield, color: 'text-green-600', label: '强证据', bg: 'bg-green-50 text-green-700' },
  moderate: { icon: TrendingUp, color: 'text-yellow-600', label: '中等证据', bg: 'bg-yellow-50 text-yellow-700' },
  weak: { icon: AlertTriangle, color: 'text-gray-500', label: '弱证据', bg: 'bg-gray-50 text-gray-600' },
};

export default function RuleCard({ rule }: { rule: WritingRule }) {
  const config = EVIDENCE_CONFIG[rule.evidence_level] ?? EVIDENCE_CONFIG.weak!;
  const Icon = config.icon;

  const shapPct = rule.shap_score != null
    ? Math.min(100, Math.round(rule.shap_score * 100000))
    : 0;

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-1">
          <Icon size={18} className={config.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-relaxed">{rule.rule_text}</p>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${config.bg}`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-400">{rule.category}</span>
            {rule.shap_score != null && (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{ width: `${Math.min(100, shapPct)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  SHAP: {rule.shap_score.toFixed(6)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
