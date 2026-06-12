import type { MultiAgentStep } from '../types';
import { answerWithRetrievedEvidence } from '../rag/answerWithRetrievedEvidence';
import { generateStrategyReportTool } from '../tools/generateStrategyReportTool';

interface StrategyAgentInput {
  question: string;
  retrievalItems: Array<{ sourceFile: string; title: string; snippet: string; score: number }>;
  sqlResult: {
    rowCount: number;
    summary: string;
  };
  analyticsResult: {
    summary: string;
  };
}

export async function runStrategyAgent(input: StrategyAgentInput): Promise<MultiAgentStep<{ report: string }>> {
  const report = generateStrategyReportTool({
    question: input.question,
    sqlResult: input.sqlResult as never,
    analyticsResult: input.analyticsResult as never,
    retrievalSummary: answerWithRetrievedEvidence(input.retrievalItems),
  });

  return {
    agent: 'strategy',
    output: { report },
  };
}
