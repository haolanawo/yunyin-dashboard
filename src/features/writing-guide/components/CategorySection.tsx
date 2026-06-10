// ============================================================
// CategorySection — 按分类分组的规则列表
// ============================================================

'use client';

import { BookOpen } from 'lucide-react';
import RuleCard from '@/features/writing-guide/components/RuleCard';
import type { WritingRule } from '@/features/writing-guide/hooks/useWritingRules';

interface CategorySectionProps {
  category: string;
  rules: WritingRule[];
}

export default function CategorySection({ category, rules }: CategorySectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={16} className="text-brand-500" />
        <h3 className="text-sm font-semibold text-gray-700">{category}</h3>
        <span className="text-xs text-gray-400">{rules.length} 条</span>
      </div>
      <div className="space-y-2">
        {rules.map((rule) => (
          <RuleCard key={rule.rule_id} rule={rule} />
        ))}
      </div>
    </div>
  );
}
