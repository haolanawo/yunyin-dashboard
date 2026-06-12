'use client';

import { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAgentRun, useAgentSessions } from '../hooks/useAgentRun';
import { EvidencePanel } from './EvidencePanel';
import { SessionHistory } from './SessionHistory';
import { ToolTracePanel } from './ToolTracePanel';

const starterQuestion = '最近30天 AI 编程类内容，什么特征最容易带来高播放和涨粉？';

export function AgentWorkspace() {
  const [question, setQuestion] = useState(starterQuestion);
  const agentRun = useAgentRun();
  const sessions = useAgentSessions();

  return (
    <div className="p-6">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Bot size={18} />
                  AI Content Strategy Agent
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Ask a strategy question and review the answer, tool trace, evidence, and saved sessions.
                </p>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  className="mt-4 min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="Describe the content strategy question you want the agent to answer."
                />
              </div>
              <Button
                className="justify-center"
                disabled={agentRun.isPending || question.trim().length === 0}
                onClick={() => agentRun.mutate(question.trim())}
              >
                <Send size={16} />
                Run Agent
              </Button>
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <Card title="Final Answer" actions={<Sparkles size={16} className="text-brand-600" />}>
            {agentRun.isPending ? (
              <p className="text-sm text-gray-500">Running skill routing, SQL, analytics, retrieval, and critique...</p>
            ) : agentRun.error ? (
              <p className="text-sm text-red-600">{agentRun.error.message}</p>
            ) : agentRun.data ? (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Intent: {agentRun.data.intent}</p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm text-gray-700">
                  {agentRun.data.answer}
                </pre>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Suggestions</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                    {agentRun.data.suggestions.map((suggestion, index) => (
                      <li key={`${suggestion}-${index}`}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Run a question to see the full agent output.</p>
            )}
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <SessionHistory sessions={sessions.data ?? []} />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <ToolTracePanel toolCalls={agentRun.data?.toolCalls ?? []} />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <EvidencePanel evidence={agentRun.data?.evidence ?? []} />
        </div>
      </div>
    </div>
  );
}
