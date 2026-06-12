import { Card } from '@/components/ui';
import type { ToolCallTrace } from '../types';

interface ToolTracePanelProps {
  toolCalls: ToolCallTrace[];
}

export function ToolTracePanel({ toolCalls }: ToolTracePanelProps) {
  return (
    <Card title="Tool Trace">
      <div className="space-y-3">
        {toolCalls.length === 0 ? (
          <p className="text-sm text-gray-500">No tool calls yet.</p>
        ) : (
          toolCalls.map((toolCall, index) => (
            <div key={`${toolCall.toolName}-${index}`} className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-800">{toolCall.toolName}</p>
                <span className="text-xs text-gray-400">step {index + 1}</span>
              </div>
              <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
              <p className="mt-2 text-sm text-gray-700">{toolCall.outputSummary}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
