import type { RetrievalResult } from '../types';
import { retrieveFromLocalKnowledge } from './localKnowledgeStore';

export async function retrieveStrategyKnowledge(question: string): Promise<RetrievalResult> {
  const items = await retrieveFromLocalKnowledge(question);
  return {
    items,
    summary:
      items.length > 0
        ? `Retrieved ${items.length} local strategy references.`
        : 'No local strategy references matched the current question.',
  };
}
