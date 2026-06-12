import type { AgentEvidence, AnalyticsToolInput, SkillContext, SkillResult, SqlToolInput } from '../types';
import { runAnalyticsAgent } from '../multiAgent/analyticsAgent';
import { runCriticAgent } from '../multiAgent/criticAgent';
import { runResearchAgent } from '../multiAgent/researchAgent';
import { runStrategyAgent } from '../multiAgent/strategyAgent';
import { detectPlatform, detectTopicHint, extractDayWindow, summarizeRetrievalItems, summarizeSqlRows } from '../utils';

interface RunSkillPipelineInput {
  skillName: string;
  context: SkillContext;
  sqlInput: SqlToolInput;
  analyticsInput: AnalyticsToolInput;
}

function buildDraftAnswer(params: {
  skillName: string;
  context: SkillContext;
  sqlSummary: ReturnType<typeof summarizeSqlRows>;
  analyticsSummary: string;
  retrievalSummary: string;
  criticSummary: string;
  report: string;
}) {
  const dayWindow = extractDayWindow(params.context.input.question);
  const platform = detectPlatform(params.context.input.question);
  const topicHint = detectTopicHint(params.context.input.question);

  return [
    `问题范围：近 ${dayWindow} 天 | 平台：${platform} | 主题提示：${topicHint ?? '未显式指定'}`,
    `技能路由：${params.skillName}`,
    '',
    `结构化样本：${params.sqlSummary.sampleSummary}`,
    ...(params.sqlSummary.patternNotes.length > 0 ? params.sqlSummary.patternNotes : []),
    `检索证据：${params.retrievalSummary}`,
    `分析摘要：${params.analyticsSummary}`,
    `审查意见：${params.criticSummary}`,
    '',
    params.report,
  ].join('\n');
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

  const sqlSummary = summarizeSqlRows(analyticsStep.output.sqlResult);
  const retrievalSummary = summarizeRetrievalItems(researchStep.output.items);

  const evidence: AgentEvidence[] = [
    {
      type: 'sql',
      title: 'SQL 查询结果',
      data: {
        sql: analyticsStep.output.sqlResult.sql,
        rowCount: analyticsStep.output.sqlResult.rowCount,
        sampleRows: sqlSummary.sampleRows,
        patternNotes: sqlSummary.patternNotes,
      },
    },
    {
      type: 'analysis',
      title: '统计分析摘要',
      data: analyticsStep.output.analyticsResult,
    },
    {
      type: 'report',
      title: '策略报告',
      data: strategyStep.output.report,
    },
    {
      type: 'analysis',
      title: 'Critic 审查',
      data: criticStep.output,
    },
    ...researchStep.output.items.map((item) => ({
      type: 'content' as const,
      title: `${item.title} (${item.sourceFile})`,
      data: item,
    })),
  ];

  const suggestions = [
    '把当前结论拆成“选题、标题、结构、平台分发”四个实验维度，避免一次改太多变量。',
    `优先复核近 ${extractDayWindow(input.context.input.question)} 天样本，确认这不是短期偶然波动。`,
    '挑 3 到 5 条高表现内容做人工复盘，把案例共性补进下一轮选题池。',
    ...(criticStep.output.warnings.length > 0 ? ['先处理 Critic 提醒的不确定性，再把这版结论当成执行策略。'] : []),
  ];

  return {
    skillName: input.skillName,
    intent: input.context.intent,
    answer: buildDraftAnswer({
      skillName: input.skillName,
      context: input.context,
      sqlSummary,
      analyticsSummary: analyticsStep.output.analyticsResult.summary,
      retrievalSummary,
      criticSummary: criticStep.output.summary,
      report: strategyStep.output.report,
    }),
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
        outputSummary: 'Generated a report with sample scope, evidence, strategy ideas, and uncertainty notes.',
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
