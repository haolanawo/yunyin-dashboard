import { createMemory } from './memory/createMemory';
import { reuseMemoryInAgent } from './memory/reuseMemoryInAgent';
import { detectAgentIntent } from './intent';
import { skillRouter } from './skills/skillRouter';
import type { AgentInput, AgentResult } from './types';

export async function runContentStrategyAgent(input: AgentInput): Promise<AgentResult> {
  const intent = detectAgentIntent(input.question);
  const memory = await reuseMemoryInAgent(input.question, input.userId);
  const skill = skillRouter(intent);

  const result = await skill.run({
    input,
    intent,
    memorySummary: memory.summary,
  });

  const memoryNote = memory.summary ? `\n\nMemory context reused:\n${memory.summary}` : '';

  const finalResult: AgentResult = {
    answer: `${result.answer}${memoryNote}`,
    intent: result.intent,
    toolCalls: result.toolCalls,
    evidence: result.evidence,
    suggestions: result.suggestions,
  };

  await createMemory(input, finalResult);
  return finalResult;
}
