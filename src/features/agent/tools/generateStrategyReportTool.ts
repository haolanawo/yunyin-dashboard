import type { AnalyticsToolResult, SqlToolResult } from '../types';

interface StrategyReportInput {
  question: string;
  sqlResult?: SqlToolResult;
  analyticsResult?: AnalyticsToolResult;
  retrievalSummary?: string;
}

export function generateStrategyReportTool(input: StrategyReportInput) {
  const lines: string[] = [];

  lines.push(`# Strategy Report`);
  lines.push('');
  lines.push(`## Conclusion Summary`);
  lines.push(
    input.sqlResult?.rowCount
      ? `- Data query returned ${input.sqlResult.rowCount} rows relevant to the question.`
      : '- Data query did not return enough rows to support a strong conclusion.',
  );
  if (input.analyticsResult?.summary) {
    lines.push(`- Analytics summary: ${input.analyticsResult.summary}`);
  }
  if (input.retrievalSummary) {
    lines.push(`- Retrieved context: ${input.retrievalSummary}`);
  }

  lines.push('');
  lines.push(`## Data Basis`);
  lines.push(input.sqlResult?.summary ?? '- No structured SQL basis available.');
  lines.push(input.analyticsResult?.source ? `- Analytics source: ${input.analyticsResult.source}` : '- No analytics source available.');

  lines.push('');
  lines.push(`## Possible Reasons`);
  if (input.analyticsResult?.highlights.length) {
    for (const highlight of input.analyticsResult.highlights.slice(0, 4)) {
      lines.push(`- ${highlight}`);
    }
  } else {
    lines.push('- The current sample does not support strong causal claims.');
  }

  lines.push('');
  lines.push(`## Strategy Suggestions`);
  lines.push(`- Prioritize formats, topics, and accounts that repeatedly appear in the top query results.`);
  lines.push(`- Validate promising patterns with a fresh 7-day or 30-day slice before making a broader content bet.`);
  lines.push(`- Re-check whether the same pattern appears across platforms before applying a universal rule.`);

  lines.push('');
  lines.push(`## Risks And Uncertainty`);
  lines.push(`- Current findings are based on observed performance and may reflect correlation rather than causation.`);
  lines.push(`- Missing fields, schema drift, or partial platform coverage can reduce confidence.`);
  lines.push(`- When row counts are low, treat recommendations as exploratory rather than final.`);

  return lines.join('\n');
}
