'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Clock3, Pencil, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui';
import type { MemoryRecord } from '../types';
import { useDeleteAgentSession, useRenameAgentSession } from '../hooks/useAgentRun';

interface SessionHistoryProps {
  sessions: MemoryRecord[];
}

const repairedStarterQuestion = '最近30天 AI 编程类内容，什么特征最容易带来高播放和涨粉？';
const legacyMojibakeMarkers = ['\u00e6', '\u93c8'];
const legacyMemoryDelimiter = ['Memory context', 'reused:'].join(' ');

function displayQuestion(question: string) {
  const looksLikeLegacyStarter =
    question.includes('??30?') || legacyMojibakeMarkers.some((marker) => question.includes(marker));

  if (looksLikeLegacyStarter && question.includes('AI')) {
    return repairedStarterQuestion;
  }
  return question;
}

function normalizeQuestion(question: string) {
  return displayQuestion(question).trim().replace(/\s+/g, ' ').toLowerCase();
}

function displayAnswer(answer: string) {
  return (answer.split(`\n\n${legacyMemoryDelimiter}`)[0] ?? answer)
    .replace(/unknown/gi, '账号待补')
    .trim();
}

function dedupeSessions(sessions: MemoryRecord[]) {
  const seen = new Set<string>();
  return sessions.filter((session) => {
    const key = `${session.userId ?? 'default'}:${normalizeQuestion(session.question)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function SessionHistory({ sessions }: SessionHistoryProps) {
  const visibleSessions = useMemo(() => dedupeSessions(sessions), [sessions]);
  const [openId, setOpenId] = useState<string | null>(visibleSessions[0]?.id ?? null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState('');
  const deleteSession = useDeleteAgentSession();
  const renameSession = useRenameAgentSession();

  useEffect(() => {
    if (!openId && visibleSessions[0]) {
      setOpenId(visibleSessions[0].id);
    }
  }, [openId, visibleSessions]);

  function startEditing(session: MemoryRecord) {
    setEditingId(session.id);
    setEditingQuestion(displayQuestion(session.question));
  }

  async function saveTitle(id: string) {
    const question = editingQuestion.trim();
    if (!question) return;
    await renameSession.mutateAsync({ id, question });
    setEditingId(null);
    setEditingQuestion('');
  }

  return (
    <Card title="历史会话">
      <div className="space-y-3">
        {visibleSessions.length === 0 ? (
          <p className="text-sm text-gray-500">还没有保存过的 Agent 结果。</p>
        ) : (
          visibleSessions.map((session) => {
            const isOpen = openId === session.id;
            const question = displayQuestion(session.question);

            return (
              <div key={session.id} className="rounded-md border border-gray-200">
                <div className="flex items-start gap-2 p-3 transition-colors hover:bg-gray-50">
                  <button
                    type="button"
                    className="mt-0.5 text-gray-400"
                    onClick={() => setOpenId(isOpen ? null : session.id)}
                    title={isOpen ? '收起' : '展开'}
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    {editingId === session.id ? (
                      <input
                        value={editingQuestion}
                        onChange={(event) => setEditingQuestion(event.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        className="block w-full truncate text-left text-sm font-semibold text-gray-800"
                        title={question}
                        onClick={() => setOpenId(isOpen ? null : session.id)}
                      >
                        {question}
                      </button>
                    )}
                    <span className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <Clock3 size={12} />
                      {formatTime(session.createdAt)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {editingId === session.id ? (
                      <>
                        <button
                          type="button"
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
                          onClick={() => void saveTitle(session.id)}
                          disabled={renameSession.isPending || editingQuestion.trim().length === 0}
                          title="保存标题"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          onClick={() => {
                            setEditingId(null);
                            setEditingQuestion('');
                          }}
                          title="取消"
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          onClick={() => startEditing(session)}
                          title="修改标题"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          onClick={() => void deleteSession.mutateAsync(session.id)}
                          disabled={deleteSession.isPending}
                          title="删除会话"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="space-y-4 border-t border-gray-100 p-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">完整回答</p>
                      <p className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {displayAnswer(session.answer)}
                      </p>
                    </div>

                    {session.suggestions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500">下一步建议</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-600">
                          {session.suggestions.map((suggestion, index) => (
                            <li key={`${suggestion}-${index}`}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {session.evidenceTitles.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500">使用证据</p>
                        <div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-auto">
                          {session.evidenceTitles.map((title, index) => (
                            <span
                              key={`${title}-${index}`}
                              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
                              title={title}
                            >
                              {title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
