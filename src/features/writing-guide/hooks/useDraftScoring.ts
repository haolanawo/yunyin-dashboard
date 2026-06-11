// ============================================================
// Draft Scoring — 草稿打分（纯前端启发式分析）
// ============================================================

'use client';

import { useMemo } from 'react';
import type { WritingRule } from '@/features/writing-guide/hooks/useWritingRules';

// ---- 检测关键词表 ----

const HOOK_PATTERNS: { type: string; keywords: string[]; label: string }[] = [
  { type: 'announcement', keywords: ['发布', '推出', '上线', '正式', '刚刚'], label: '公告式开头' },
  { type: 'story', keywords: ['有一次', '之前', '那天', '记得', '最近'], label: '故事式开头' },
  { type: 'direct_conclusion', keywords: ['结论', '先说', '答案', '可以'], label: '结论先行' },
  { type: 'counterintuitive_fact', keywords: ['可能', '其实', '不是'], label: '反直觉事实' },
  { type: 'question', keywords: ['为什么', '怎么', '如何', '是否'], label: '提问式' },
  { type: 'alert', keywords: ['注意', '警惕', '紧急', '别'], label: '警示式' },
  { type: 'data_shock', keywords: ['数据', '统计', '调查', '%'], label: '数据冲击' },
];

const NARRATIVE_PATTERNS: { type: string; keywords: string[]; label: string }[] = [
  { type: 'how_to', keywords: ['步骤', '方法', '教程', '如何', '怎么'], label: '教程型' },
  { type: 'news_report', keywords: ['今天', '昨日', '凌晨', '报道', '宣布'], label: '新闻型' },
  { type: 'opinion_driven', keywords: ['我觉得', '我认为', '说实话', '个人'], label: '观点驱动' },
  { type: 'data_driven', keywords: ['数据', '统计', '%', '调研'], label: '数据驱动' },
  { type: 'case_driven', keywords: ['案例', '举例', '比如', '例如'], label: '案例驱动' },
];

const EMOTION_PATTERNS: { type: string; keywords: string[]; label: string }[] = [
  { type: 'optimistic', keywords: ['惊喜', '优秀', '强大', '兴奋', '赞'], label: '乐观积极' },
  { type: 'cautionary', keywords: ['警告', '风险', '注意', '别', '别被'], label: '谨慎警示' },
  { type: 'urgent', keywords: ['立刻', '马上', '紧急', '赶紧'], label: '紧迫感' },
  { type: 'skeptical', keywords: ['真的', '未必', '不', '忽悠'], label: '质疑' },
];

export interface DraftScoreResult {
  textLength: number;
  detectedHook: { type: string; label: string; score: number } | null;
  detectedNarrative: { type: string; label: string; score: number } | null;
  detectedEmotion: { type: string; label: string; score: number } | null;
  totalScore: number; // 0-100
  recommendations: {
    rule: WritingRule;
    relevance: number; // 0-1
    isSatisfied: boolean;
  }[];
  breakdown: {
    hookScore: number;   // 0-30
    narrativeScore: number; // 0-25
    emotionScore: number; // 0-15
    structureScore: number; // 0-15
    lengthScore: number;  // 0-15
  };
}

/** 检测文本中的模式, 返回匹配到的类型 */
function detectPattern(
  text: string,
  patterns: { type: string; keywords: string[]; label: string }[],
): { type: string; label: string; score: number } | null {
  const lower = text.toLowerCase();
  let best: { type: string; label: string; score: number } | null = null;

  for (const p of patterns) {
    let matchCount = 0;
    for (const kw of p.keywords) {
      if (lower.includes(kw.toLowerCase())) matchCount++;
    }
    if (matchCount > 0) {
      const score = Math.min(1, matchCount / p.keywords.length);
      if (!best || score > best.score) {
        best = { type: p.type, label: p.label, score };
      }
    }
  }
  return best;
}

/** 评估段落结构完整性 */
function evaluateStructure(text: string): number {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 0) return 0;

  let score = 0;

  // 有分段结构
  if (paragraphs.length >= 3) score += 4;
  else if (paragraphs.length >= 2) score += 2;

  // 有结论性语句
  const hasConclusion = /总结|总之|综上|因此|所以/.test(text);
  if (hasConclusion) score += 4;

  // 有列表结构
  const hasList = /^\s*[\d\-*•]/.test(text);
  if (hasList) score += 3;

  // 有引用或数据
  const hasData = /\d+%|\d+倍|第[一二三四五六七八九十]/.test(text);
  if (hasData) score += 4;

  return Math.min(15, score);
}

/** 评估文本长度得分 */
function evaluateLength(textLength: number): number {
  // 最佳区间: 800-2000 字
  if (textLength >= 800 && textLength <= 2000) return 15;
  if (textLength >= 500 && textLength < 800) return 10;
  if (textLength > 2000 && textLength <= 3000) return 10;
  if (textLength >= 300 && textLength < 500) return 6;
  return 3;
}

/** 为草稿打分 */
export function scoreDraft(text: string, rules: WritingRule[]): DraftScoreResult {
  const textLength = text.length;

  // 1. 检测模式
  const detectedHook = detectPattern(text, HOOK_PATTERNS);
  const detectedNarrative = detectPattern(text, NARRATIVE_PATTERNS);
  const detectedEmotion = detectPattern(text, EMOTION_PATTERNS);

  // 2. 各维度评分
  const hookScore = detectedHook ? Math.round(30 * detectedHook.score) : 0;
  const narrativeScore = detectedNarrative ? Math.round(25 * detectedNarrative.score) : 12; // default
  const emotionScore = detectedEmotion ? Math.round(15 * detectedEmotion.score) : 8;
  const structureScore = evaluateStructure(text);
  const lengthScore = evaluateLength(textLength);

  // 3. 规则匹配
  const recommendations = rules.map((rule) => {
    const lowerText = text.toLowerCase();
    const lowerRule = rule.rule_text.toLowerCase();

    // Simple keyword overlap relevance
    const ruleWords = lowerRule.split(/\s+/).filter((w) => w.length > 2);
    let matchCount = 0;
    for (const word of ruleWords) {
      if (lowerText.includes(word)) matchCount++;
    }
    const relevance = ruleWords.length > 0 ? matchCount / ruleWords.length : 0;

    // If relevance > 0.3, consider it satisfied
    const isSatisfied = relevance > 0.3;

    return { rule, relevance: Math.min(1, relevance), isSatisfied };
  });

  // 4. 总分
  const totalScore = Math.min(100, hookScore + narrativeScore + emotionScore + structureScore + lengthScore);

  return {
    textLength,
    detectedHook,
    detectedNarrative,
    detectedEmotion,
    totalScore,
    recommendations: recommendations.sort((a, b) => b.relevance - a.relevance).slice(0, 10),
    breakdown: {
      hookScore,
      narrativeScore,
      emotionScore,
      structureScore,
      lengthScore,
    },
  };
}
