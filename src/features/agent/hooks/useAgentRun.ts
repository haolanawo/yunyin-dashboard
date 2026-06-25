'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
    throw new Error(payload.error ?? 'Agent 运行失败。');
  }

  return (await response.json()) as AgentResult;
}

export function useAgentRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postAgentQuestion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    },
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
        throw new Error('历史会话加载失败。');
      }
      return (await response.json()) as MemoryRecord[];
    },
    staleTime: 10_000,
  });
}

async function deleteAgentSession(id: string) {
  const response = await fetch(`/api/agent?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? '删除历史会话失败。');
  }
}

async function renameAgentSession(input: { id: string; question: string }) {
  const response = await fetch('/api/agent', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? '修改历史标题失败。');
  }

  return (await response.json()) as { session: MemoryRecord };
}

export function useDeleteAgentSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAgentSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    },
  });
}

export function useRenameAgentSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renameAgentSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    },
  });
}
