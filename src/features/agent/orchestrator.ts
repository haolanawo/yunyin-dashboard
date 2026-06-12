import { createMemory } from './memory/createMemory';
import { getLlmAdapter } from './llm/adapter';
import { reuseMemoryInAgent } from './memory/reuseMemoryInAgent';
import { detectAgentIntent } from './intent';
import { skillRouter } from './skills/skillRouter';
import type { AgentInput, AgentResult } from './types';

async function synthesizeWithLlm(params: {
  input: AgentInput;
  draft: AgentResult;
  memorySummary?: string;
}) {
  const adapter = getLlmAdapter();
  if (!adapter.isConfigured()) {
    return null;
  }

  const evidenceTitles = params.draft.evidence.map((item) => `- [${item.type}] ${item.title}`).join('\n');
  const suggestions = params.draft.suggestions.map((item) => `- ${item}`).join('\n');

  const content = await adapter.generate([
    {
      role: 'system',
      content:
        'You are an AI content strategy agent. Rewrite the draft answer into concise Chinese. Keep every claim grounded in the provided evidence and uncertainty notes. Return strict JSON with keys "answer" and "suggestions". "suggestions" must be an array of strings.',
    },
    {
      role: 'user',
      content: [
        `Question:\n${params.input.question}`,
        `Intent:\n${params.draft.intent}`,
        `Memory Summary:\n${params.memorySummary || 'none'}`,
        `Draft Answer:\n${params.draft.answer}`,
        `Evidence:\n${evidenceTitles || 'none'}`,
        `Draft Suggestions:\n${suggestions || 'none'}`,
      ].join('\n\n'),
    },
  ]);

  const parsed = JSON.parse(content) as {
    answer?: string;
    suggestions?: string[];
  };

  if (!parsed.answer) {
    throw new Error('DeepSeek synthesis response did not include an answer.');
  }

  return {
    answer: parsed.answer,
    suggestions: Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0 ? parsed.suggestions : params.draft.suggestions,
    model: adapter.name,
  };
}

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
  let llmOutput: Awaited<ReturnType<typeof synthesizeWithLlm>> = null;

  try {
    llmOutput = await synthesizeWithLlm({
      input,
      draft: result,
      memorySummary: memory.summary,
    });
  } catch {
    llmOutput = null;
  }

  const finalResult: AgentResult = {
    answer: `${llmOutput?.answer ?? result.answer}${memoryNote}`,
    intent: result.intent,
    toolCalls: [
      ...result.toolCalls,
      ...(llmOutput
        ? [
            {
              toolName: 'deepseek_llm_synthesis',
              input: {
                model: llmOutput.model,
                question: input.question,
              },
              outputSummary: 'Polished the final answer and suggestions with DeepSeek v4-flash.',
            },
          ]
        : []),
    ],
    evidence: result.evidence,
    suggestions: llmOutput?.suggestions ?? result.suggestions,
  };

  await createMemory(input, finalResult);
  return finalResult;
}
