import { Card } from '@/components/ui';
import type { MemoryRecord } from '../types';

interface SessionHistoryProps {
  sessions: MemoryRecord[];
}

export function SessionHistory({ sessions }: SessionHistoryProps) {
  return (
    <Card title="History">
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-500">No saved sessions yet.</p>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="rounded-md border border-gray-200 p-3">
              <p className="text-sm font-semibold text-gray-800">{session.question}</p>
              <p className="mt-1 text-sm text-gray-600">{session.answer.slice(0, 140)}</p>
              <p className="mt-2 text-xs text-gray-400">{new Date(session.createdAt).toLocaleString('zh-CN')}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
