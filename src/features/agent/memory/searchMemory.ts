import type { MemoryRecord } from '../types';
import { readMemoryStore } from './localMemoryStore';

export async function searchMemory(question: string, userId?: string): Promise<MemoryRecord[]> {
  const records = await readMemoryStore();
  const terms = question
    .toLowerCase()
    .split(/[\s,，。？?！!]+/)
    .filter((term) => term.length >= 2);

  return records
    .filter((record) => (userId ? record.userId === userId : true))
    .map((record) => ({
      record,
      score: terms.reduce((score, term) => score + (record.question.toLowerCase().includes(term) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.record);
}
