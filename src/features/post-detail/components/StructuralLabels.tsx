// ============================================================
// StructuralLabels — 结构分析标签展示
// ============================================================

'use client';

import {
  Lightbulb, BookOpen, Heart, MessageSquare, UserCheck,
  CheckCircle, Tag, Hash, BarChart3, DollarSign, Gift,
} from 'lucide-react';
import type { ContentDetail } from '@/features/post-detail/hooks/useContentDetail';

interface LabelRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}

function LabelRow({ icon, label, value }: LabelRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="text-gray-400 shrink-0">{icon}</div>
      <span className="text-sm text-gray-600 w-28 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value ?? '--'}</span>
    </div>
  );
}

function TagList({ icon, label, items }: { icon: React.ReactNode; label: string; items: string[] | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="text-gray-400 shrink-0 mt-0.5">{icon}</div>
      <span className="text-sm text-gray-600 w-28 shrink-0 mt-0.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {(items ?? []).length > 0
          ? items!.map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded">
                {t}
              </span>
            ))
          : <span className="text-sm text-gray-400">--</span>
        }
      </div>
    </div>
  );
}

interface StructuralLabelsProps {
  content: ContentDetail;
}

export default function StructuralLabels({ content }: StructuralLabelsProps) {
  const boolLabel = (v: boolean | null | undefined) =>
    v === true ? '是' : v === false ? '否' : '--';

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4">AI 结构分析</h2>

      {/* AI Score */}
      <div className="mb-6 bg-gradient-to-r from-brand-50 to-purple-50 rounded-lg p-4 text-center">
        <div className="text-xs text-gray-500 mb-1">AI 综合评分</div>
        <div className="text-3xl font-bold text-brand-600">
          {content.ai_score !== null ? content.ai_score.toFixed(1) : '--'}
        </div>
      </div>

      <div className="space-y-0">
        <LabelRow icon={<Lightbulb size={16} />} label="开头钩子" value={content.hook_type} />
        <LabelRow icon={<BookOpen size={16} />} label="叙事模式" value={content.narrative_mode} />
        <LabelRow icon={<Heart size={16} />} label="情感倾向" value={content.emotional_valence} />
        <LabelRow icon={<MessageSquare size={16} />} label="论证风格" value={content.dominant_arg_style} />
        <LabelRow icon={<UserCheck size={16} />} label="人设类型" value={content.persona} />
        <TagList icon={<Tag size={16} />} label="段落类型" items={content.segment_types} />
        <LabelRow icon={<CheckCircle size={16} />} label="有结论" value={boolLabel(content.has_conclusion)} />
        <LabelRow icon={<CheckCircle size={16} />} label="有推广" value={boolLabel(content.has_promotion)} />
        {content.has_promotion && (
          <LabelRow icon={<CheckCircle size={16} />} label="推广位置" value={content.promotion_position} />
        )}
        <LabelRow icon={<BarChart3 size={16} />} label="文本长度" value={content.text_length ? `${content.text_length} 字` : '--'} />
        <LabelRow icon={<Hash size={16} />} label="数据引用" value={content.data_count != null ? `${content.data_count} 处` : '--'} />
        <LabelRow icon={<DollarSign size={16} />} label="提及价格" value={boolLabel(content.mentions_price)} />
        <LabelRow icon={<Gift size={16} />} label="提及免费" value={boolLabel(content.mentions_free)} />
        <TagList icon={<Tag size={16} />} label="涉及主题" items={content.topic_types} />
        <TagList icon={<Tag size={16} />} label="工具家族" items={content.tool_families} />
      </div>
    </div>
  );
}
