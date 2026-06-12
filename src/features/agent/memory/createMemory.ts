import crypto from 'crypto';
import type { AgentInput, AgentResult, MemoryRecord } from '../types';
import { readMemoryStore, writeMemoryStore } from './localMemoryStore';

export async function createMemory(input: AgentInput, result: AgentResult) {
  const records = await readMemoryStore();
  const record: MemoryRecord = {
    id: crypto.randomUUID(),
    userId: input.userId,
    question: input.question,
    answer: result.answer,
    suggestions: result.suggestions,
    evidenceTitles: result.evidence.map((item) => item.title),
    createdAt: new Date().toISOString(),
  };
  records.unshift(record);
  await writeMemoryStore(records.slice(0, 200));
  return record;
}
