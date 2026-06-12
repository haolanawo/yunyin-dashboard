'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { AgentResult, MemoryRecord } from '../types';

async function postAgentQuestion(question: string) {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? 'Failed to run the content strategy agent.');
  }

  return (await response.json()) as AgentResult;
}

export function useAgentRun() {
  return useMutation({
    mutationFn: postAgentQuestion,
  });
}

export function useAgentSessions() {
  return useQuery({
    queryKey: ['agent-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/agent?history=1', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to load agent session history.');
      }
      return (await response.json()) as MemoryRecord[];
    },
    staleTime: 10_000,
  });
}
