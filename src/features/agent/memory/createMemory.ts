import crypto from 'crypto';
import type { AgentInput, AgentResult, MemoryRecord } from '../types';
import { upsertMemoryRecord } from './localMemoryStore';

export async function createMemory(input: AgentInput, result: AgentResult) {
  const record: MemoryRecord = {
    id: crypto.randomUUID(),
    userId: input.userId,
    question: input.question,
    answer: result.answer,
    suggestions: result.suggestions,
    evidenceTitles: result.evidence.map((item) => item.title),
    createdAt: new Date().toISOString(),
  };
  await upsertMemoryRecord(record);
  return record;
}
