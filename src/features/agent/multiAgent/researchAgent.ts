import type { MultiAgentStep, RetrievalResult } from '../types';
import { retrieveStrategyKnowledge } from '../rag/retrieveStrategyKnowledge';

export async function runResearchAgent(question: string): Promise<MultiAgentStep<RetrievalResult>> {
  const output = await retrieveStrategyKnowledge(question);
  return {
    agent: 'research',
    output,
  };
}
