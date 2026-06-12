import type { AnalyticsToolInput, MultiAgentStep, SqlToolInput } from '../types';
import { queryDatabaseTool } from '../tools/queryDatabaseTool';
import { runAnalyticsTool } from '../tools/runAnalyticsTool';

export async function runAnalyticsAgent(sqlInput: SqlToolInput, analyticsInput: AnalyticsToolInput): Promise<
  MultiAgentStep<{
    sqlResult: Awaited<ReturnType<typeof queryDatabaseTool>>;
    analyticsResult: Awaited<ReturnType<typeof runAnalyticsTool>>;
  }>
> {
  const [sqlResult, analyticsResult] = await Promise.all([
    queryDatabaseTool(sqlInput),
    runAnalyticsTool(analyticsInput),
  ]);

  return {
    agent: 'analytics',
    output: {
      sqlResult,
      analyticsResult,
    },
  };
}
