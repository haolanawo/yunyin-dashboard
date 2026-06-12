import type { AnalyticsToolResult, SqlToolResult } from '../types';
import { summarizeSqlRows } from '../utils';

interface StrategyReportInput {
  question: string;
  sqlResult?: SqlToolResult;
  analyticsResult?: AnalyticsToolResult;
  retrievalSummary?: string;
}

export function generateStrategyReportTool(input: StrategyReportInput) {
  const lines: string[] = [];
  const sqlSummary = summarizeSqlRows(input.sqlResult);

  lines.push(`# Strategy Report`);
  lines.push('');
  lines.push(`## 结论摘要`);
  lines.push(
    input.sqlResult?.rowCount
      ? `- 本次结构化查询返回 ${input.sqlResult.rowCount} 条相关样本。`
      : '- 本次结构化查询没有返回足够样本，当前更适合输出“数据不足”。',
  );
  if (input.analyticsResult?.summary) {
    lines.push(`- 分析摘要：${input.analyticsResult.summary}`);
  }
  if (input.retrievalSummary) {
    lines.push(`- 检索到的历史证据：${input.retrievalSummary}`);
  }

  lines.push('');
  lines.push(`## 数据依据`);
  lines.push(`- ${sqlSummary.sampleSummary}`);
  lines.push(`- ${input.sqlResult?.summary ?? '没有可用的 SQL 数据依据。'}`);
  lines.push(input.analyticsResult?.source ? `- 分析脚本来源：${input.analyticsResult.source}` : '- 没有可用的分析脚本来源。');
  if (sqlSummary.patternNotes.length > 0) {
    sqlSummary.patternNotes.forEach((item) => lines.push(`- ${item}`));
  }
  if (sqlSummary.sampleRows.length > 0) {
    lines.push(`- 典型样本：`);
    for (const row of sqlSummary.sampleRows) {
      lines.push(
        `  - ${String(row.title ?? 'untitled')} | ${String(row.platform ?? 'unknown')} | ${String(row.account_name ?? 'unknown')} | 播放/赞/涨粉: ${String(row.views ?? '-')}/${String(row.likes ?? '-')}/${String(row.new_followers ?? '-')}`,
      );
    }
  }

  lines.push('');
  lines.push(`## 可能原因`);
  if (input.analyticsResult?.highlights.length) {
    for (const highlight of input.analyticsResult.highlights.slice(0, 4)) {
      lines.push(`- ${highlight}`);
    }
  } else {
    lines.push('- The current sample does not support strong causal claims.');
  }

  lines.push('');
  lines.push(`## 策略建议`);
  lines.push(`- 优先测试在高表现样本里重复出现的主题、结构和账号打法，而不是一次性放大单条案例。`);
  lines.push(`- 把“高播放”和“涨粉”拆开验证：有些内容适合拉播放，不一定适合拉新增关注。`);
  lines.push(`- 下一轮复盘时同时看近 7 天和近 30 天，确认结论是稳定模式还是短期波动。`);

  lines.push('');
  lines.push(`## 风险与不确定性`);
  lines.push(`- 当前结论基于观察到的相关性，不应直接当作因果结论。`);
  lines.push(`- 字段缺失、schema 漂移、平台覆盖不完整，都会削弱结论置信度。`);
  lines.push(`- 当样本量偏小或高度集中在单一账号时，策略建议应视为探索假设。`);

  return lines.join('\n');
}
