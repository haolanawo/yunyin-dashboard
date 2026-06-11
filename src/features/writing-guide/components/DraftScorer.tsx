// ============================================================
// DraftScorer — 草稿打分面板
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, FileText, Lightbulb } from 'lucide-react';
import { scoreDraft } from '@/features/writing-guide/hooks/useDraftScoring';
import type { WritingRule } from '@/features/writing-guide/hooks/useWritingRules';

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 45) return 'text-yellow-600';
  return 'text-red-500';
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-green-50 border-green-200';
  if (score >= 45) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 55) return '一般';
  if (score >= 40) return '待改进';
  return '需大幅优化';
}

export default function DraftScorer({ rules }: { rules: WritingRule[] }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ReturnType<typeof scoreDraft> | null>(null);

  const handleAnalyze = useCallback(() => {
    if (!text.trim()) return;
    const r = scoreDraft(text.trim(), rules);
    setResult(r);
  }, [text, rules]);

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">草稿打分</h2>
      <p className="text-sm text-gray-500 mb-4">粘贴你的内容草稿，AI 启发式分析给出结构评分与优化建议</p>

      {/* 输入区 */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="在此粘贴你的草稿内容..."
        rows={6}
        className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-y
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          placeholder:text-gray-300"
      />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">
          {text.length > 0 ? `${text.length} 字` : ''}
        </span>
        <button
          onClick={handleAnalyze}
          disabled={!text.trim()}
          className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg
            hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          开始分析
        </button>
      </div>

      {/* 结果区 */}
      {result && (
        <div className="mt-6 space-y-5">
          {/* 总分卡片 */}
          <div className={`rounded-lg border p-5 ${getScoreBg(result.totalScore)}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">综合评分</div>
                <div className={`text-3xl font-bold ${getScoreColor(result.totalScore)}`}>
                  {result.totalScore}
                </div>
                <div className="text-xs mt-1 text-gray-500">
                  {getScoreLabel(result.totalScore)}
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                共 {result.textLength} 字
              </div>
            </div>
          </div>

          {/* 维度雷达 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-3">各维度得分</h4>
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: '开头吸引', key: 'hookScore', max: 30, value: result.breakdown.hookScore, detected: result.detectedHook?.label },
                { label: '叙述方式', key: 'narrativeScore', max: 25, value: result.breakdown.narrativeScore, detected: result.detectedNarrative?.label },
                { label: '情感基调', key: 'emotionScore', max: 15, value: result.breakdown.emotionScore, detected: result.detectedEmotion?.label },
                { label: '段落结构', key: 'structureScore', max: 15, value: result.breakdown.structureScore },
                { label: '内容长度', key: 'lengthScore', max: 15, value: result.breakdown.lengthScore },
              ].map((dim) => {
                const pct = dim.max > 0 ? Math.round((dim.value / dim.max) * 100) : 0;
                return (
                  <div key={dim.key} className="text-center">
                    <div className="text-lg font-bold text-gray-800">{dim.value}</div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">{dim.label}</div>
                    {dim.detected && (
                      <div className="text-[10px] text-brand-500 font-medium">{dim.detected}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 检测摘要 */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1">
              <FileText size={14} />
              开头: {result.detectedHook?.label ?? '未检测到'}
            </div>
            <div className="flex items-center gap-1">
              <FileText size={14} />
              叙述: {result.detectedNarrative?.label ?? '未检测到'}
            </div>
            <div className="flex items-center gap-1">
              <FileText size={14} />
              情感: {result.detectedEmotion?.label ?? '中性'}
            </div>
          </div>

          {/* 规则匹配建议 */}
          {result.recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-3">写作规则匹配</h4>
              <div className="space-y-2">
                {result.recommendations.slice(0, 5).map((rec) => (
                  <div
                    key={rec.rule.rule_id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      rec.isSatisfied
                        ? 'border-green-100 bg-green-50/50'
                        : 'border-gray-100 bg-gray-50/50'
                    }`}
                  >
                    {rec.isSatisfied ? (
                      <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-700 leading-relaxed">{rec.rule.rule_text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1 py-0.5 rounded ${
                          rec.isSatisfied ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {rec.isSatisfied ? '已满足' : '建议优化'}
                        </span>
                        <span className="text-[10px] text-gray-400">{rec.rule.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 推荐建议 */}
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 flex items-start gap-3">
            <Lightbulb size={18} className="text-brand-500 shrink-0 mt-0.5" />
            <div className="text-xs text-brand-700 leading-relaxed">
              <strong>优化建议：</strong>
              {result.totalScore < 70 && '你的草稿还有较大的优化空间。'}
              {!result.detectedHook && '尝试使用更吸引人的开头方式（故事、反直觉事实、提问等）。'}
              {result.detectedEmotion?.type === 'neutral' && '考虑加入更鲜明的情感色彩，增强文章感染力。'}
              {result.textLength < 500 && '内容长度偏短，建议扩充到 800 字以上以获得更好的传播效果。'}
              {result.totalScore >= 70 && '整体质量不错，继续保持！'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
