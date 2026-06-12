import { searchMemory } from './searchMemory';
import { summarizeMemory } from './summarizeMemory';

export async function reuseMemoryInAgent(question: string, userId?: string) {
  const matches = await searchMemory(question, userId);
  return {
    matches,
    summary: summarizeMemory(matches),
  };
}
