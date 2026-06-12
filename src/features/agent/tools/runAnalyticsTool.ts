import type { AnalyticsToolInput, AnalyticsToolResult } from '../types';
import { runPythonJsonScript } from './pythonBridge';

interface PythonAnalyticsResult {
  source: string;
  summary: string;
  highlights: string[];
  rawExcerpt: string;
}

export async function runAnalyticsTool(input: AnalyticsToolInput): Promise<AnalyticsToolResult> {
  const result = (await runPythonJsonScript('scripts/agent/run_analysis.py', input)) as PythonAnalyticsResult;
  return result;
}
