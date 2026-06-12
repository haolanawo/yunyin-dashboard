import type { AgentEvidence, AnalyticsToolInput, SkillContext, SkillResult, SqlToolInput } from '../types';
import { runAnalyticsAgent } from '../multiAgent/analyticsAgent';
import { runCriticAgent } from '../multiAgent/criticAgent';
import { runResearchAgent } from '../multiAgent/researchAgent';
import { runStrategyAgent } from '../multiAgent/strategyAgent';

interface RunSkillPipelineInput {
  skillName: string;
  context: SkillContext;
  sqlInput: SqlToolInput;
  analyticsInput: AnalyticsToolInput;
}

export async function runSkillPipeline(input: RunSkillPipelineInput): Promise<SkillResult> {
  const researchStep = await runResearchAgent(input.context.input.question);
  const analyticsStep = await runAnalyticsAgent(input.sqlInput, input.analyticsInput);
  const strategyStep = await runStrategyAgent({
    question: input.context.input.question,
    retrievalItems: researchStep.output.items,
    sqlResult: analyticsStep.output.sqlResult,
    analyticsResult: analyticsStep.output.analyticsResult,
  });
  const criticStep = await runCriticAgent({
    rowCount: analyticsStep.output.sqlResult.rowCount,
    evidenceCount: researchStep.output.items.length,
    report: strategyStep.output.report,
  });

  const evidence: AgentEvidence[] = [
    {
      type: 'sql',
      title: 'SQL query result',
      data: {
        sql: analyticsStep.output.sqlResult.sql,
        rowCount: analyticsStep.output.sqlResult.rowCount,
        preview: analyticsStep.output.sqlResult.rows.slice(0, 5),
      },
    },
    {
      type: 'analysis',
      title: 'Analytics summary',
      data: analyticsStep.output.analyticsResult,
    },
    {
      type: 'report',
      title: 'Strategy report',
      data: strategyStep.output.report,
    },
    ...researchStep.output.items.map((item) => ({
      type: 'content' as const,
      title: `${item.title} (${item.sourceFile})`,
      data: item,
    })),
  ];

  const suggestions = [
    '缩小到近7天和近30天分别复核一次，确认模式是否稳定。',
    '把高表现样本按标题、主题、平台拆开，避免把相关性误当成统一规律。',
    ...(criticStep.output.warnings.length > 0 ? ['先处理 Critic 提示的不确定性，再把策略当成执行结论。'] : []),
  ];

  const answerLines = [
    `Intent: ${input.context.intent}`,
    analyticsStep.output.sqlResult.summary,
    analyticsStep.output.analyticsResult.summary,
    researchStep.output.summary,
    criticStep.output.summary,
    '',
    strategyStep.output.report,
  ];

  return {
    skillName: input.skillName,
    intent: input.context.intent,
    answer: answerLines.join('\n'),
    toolCalls: [
      {
        toolName: 'retrieveStrategyKnowledge',
        input: { question: input.context.input.question },
        outputSummary: researchStep.output.summary,
      },
      {
        toolName: 'queryDatabaseTool',
        input: input.sqlInput,
        outputSummary: analyticsStep.output.sqlResult.summary,
      },
      {
        toolName: 'runAnalyticsTool',
        input: input.analyticsInput,
        outputSummary: analyticsStep.output.analyticsResult.summary,
      },
      {
        toolName: 'generateStrategyReportTool',
        input: { question: input.context.input.question },
        outputSummary: 'Generated strategy report with uncertainty section.',
      },
      {
        toolName: 'criticAgent',
        input: {
          rowCount: analyticsStep.output.sqlResult.rowCount,
          evidenceCount: researchStep.output.items.length,
        },
        outputSummary: criticStep.output.summary,
      },
    ],
    evidence,
    suggestions,
  };
}
