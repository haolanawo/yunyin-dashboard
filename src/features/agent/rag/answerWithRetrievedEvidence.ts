import type { RetrievalItem } from '../types';

export function answerWithRetrievedEvidence(items: RetrievalItem[]) {
  if (items.length === 0) {
    return 'No retrieval evidence was found in local reports or specs.';
  }

  return items
    .slice(0, 3)
    .map((item) => `${item.title} (${item.sourceFile})`)
    .join('; ');
}
