import type { MemoryRecord } from '../types';

export function summarizeMemory(records: MemoryRecord[]) {
  if (records.length === 0) {
    return '';
  }

  return records
    .slice(0, 3)
    .map((record) => `Q: ${record.question} | A: ${record.answer.slice(0, 80)}`)
    .join('\n');
}
