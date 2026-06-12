import type { MultiAgentStep } from '../types';

interface CriticAgentInput {
  rowCount: number;
  evidenceCount: number;
  report: string;
}

export async function runCriticAgent(input: CriticAgentInput): Promise<
  MultiAgentStep<{ warnings: string[]; summary: string }>
> {
  const warnings: string[] = [];

  if (input.rowCount === 0) {
    warnings.push('No SQL rows were returned, so the answer should be framed as data insufficient.');
  }

  if (input.rowCount > 0 && input.rowCount < 5) {
    warnings.push('The SQL sample is small, so any recommendation should be treated as directional.');
  }

  if (input.evidenceCount === 0) {
    warnings.push('No retrieval evidence was attached, so historical context is limited.');
  }

  if (!/risk|uncertainty|不确定/i.test(input.report)) {
    warnings.push('The generated report is missing an explicit uncertainty section.');
  }

  return {
    agent: 'critic',
    output: {
      warnings,
      summary: warnings.length > 0 ? warnings.join(' ') : 'The answer includes evidence and uncertainty notes.',
    },
  };
}
