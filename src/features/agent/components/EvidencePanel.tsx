import { Card } from '@/components/ui';
import type { AgentEvidence } from '../types';

interface EvidencePanelProps {
  evidence: AgentEvidence[];
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  return (
    <Card title="Evidence">
      <div className="space-y-3">
        {evidence.length === 0 ? (
          <p className="text-sm text-gray-500">No evidence attached yet.</p>
        ) : (
          evidence.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <span className="text-xs uppercase tracking-wide text-gray-400">{item.type}</span>
              </div>
              <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
                {JSON.stringify(item.data, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
