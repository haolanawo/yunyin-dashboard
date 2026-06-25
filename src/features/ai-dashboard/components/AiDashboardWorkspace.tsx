'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bot, Check, Database, Loader2, Pencil, Save, Sparkles, Table2, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { AdminPasswordDialog } from './AdminPasswordDialog';
import { VegaPreview } from './VegaPreview';
import type {
  AiAgentPart,
  AiDataSource,
  GenerateViewResponse,
  QueryResultRow,
  SavedView,
  TableSchema,
} from '@/features/ai-dashboard/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  parts?: AiAgentPart[];
  view?: GenerateViewResponse['view'];
}

export function AiDashboardWorkspace() {
  const [dataSources, setDataSources] = useState<AiDataSource[]>([]);
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<AiDataSource['id']>('supabase');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('请推荐一个适合这些表的可视化图表');
  const [loading, setLoading] = useState(false);
  const [queryRows, setQueryRows] = useState<QueryResultRow[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [pendingSaveView, setPendingSaveView] = useState<GenerateViewResponse['view']>(null);
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingViewTitle, setEditingViewTitle] = useState('');

  const latestDraft = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message?.view) return message.view;
    }
    return null;
  }, [messages]);

  async function loadMetadata() {
    const response = await fetch('/api/ai-dashboard/metadata');
    const json = await response.json();
    setDataSources(json.dataSources ?? []);
    setTables(json.tables ?? []);
    const firstAvailable = (json.dataSources ?? []).find((source: AiDataSource) => source.available);
    if (firstAvailable) {
      setSelectedDataSourceId(firstAvailable.id);
    }
  }

  async function loadSavedViews() {
    const response = await fetch('/api/ai-dashboard/views');
    const json = await response.json();
    setSavedViews(json.views ?? []);
  }

  useEffect(() => {
    loadMetadata();
    loadSavedViews();
  }, []);

  useEffect(() => {
    async function previewLatestDraft() {
      if (!latestDraft) {
        setQueryRows([]);
        setQueryError(null);
        return;
      }

      try {
        setQueryError(null);
        const response = await fetch('/api/ai-dashboard/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataSourceId: selectedDataSourceId,
            sql: latestDraft.querySql,
          }),
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error ?? '获取图表数据失败');
        }
        setQueryRows(json.data ?? []);
      } catch (error) {
        setQueryRows([]);
        setQueryError(error instanceof Error ? error.message : '获取图表数据时出错');
      }
    }

    previewLatestDraft();
  }, [latestDraft, selectedDataSourceId]);

  const handleToggleTable = (tableName: string) => {
    setSelectedTables((current) =>
      current.includes(tableName) ? current.filter((item) => item !== tableName) : [...current, tableName],
    );
  };

  const handleGenerate = async () => {
    if (!input.trim() || !selectedTables.length || loading) return;

    const nextMessages = [...messages, { role: 'user' as const, content: input.trim() }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/ai-dashboard/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSourceId: selectedDataSourceId,
          selectedTables,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });
      const json = (await response.json()) as GenerateViewResponse & { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? 'AI 生成失败');
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: json.assistantMessage,
          parts: json.parts ?? [],
          view: json.view,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'AI 生成失败',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const performSave = async () => {
    if (!pendingSaveView) return;
    const response = await fetch('/api/ai-dashboard/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataSourceId: selectedDataSourceId,
        selectedTables,
        draft: pendingSaveView,
      }),
    });
    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.error ?? '保存视图失败');
    }
    await loadSavedViews();
    setAdminDialogOpen(false);
    setPendingSaveView(null);
  };

  const handleDeleteSavedView = async (id: string) => {
    const response = await fetch(`/api/ai-dashboard/views?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.error ?? '删除视图失败');
    }
    await loadSavedViews();
  };

  const handleRenameSavedView = async (id: string) => {
    const title = editingViewTitle.trim();
    if (!title) return;

    const response = await fetch('/api/ai-dashboard/views', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title }),
    });
    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.error ?? '修改视图标题失败');
    }
    await loadSavedViews();
    setEditingViewId(null);
    setEditingViewTitle('');
  };

  const handleSaveView = async () => {
    if (!latestDraft) return;
    const storedPassword = typeof window !== 'undefined' ? localStorage.getItem('ai_dashboard_admin_password') : null;
    setPendingSaveView(latestDraft);

    if (!storedPassword) {
      setAdminDialogOpen(true);
      return;
    }

    const verifyResponse = await fetch('/api/ai-dashboard/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: storedPassword }),
    });
    const verifyJson = await verifyResponse.json();
    if (!verifyJson.success) {
      localStorage.removeItem('ai_dashboard_admin_password');
      setAdminDialogOpen(true);
      return;
    }

    await performSave();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI 图表</h1>
          <p className="mt-1 text-sm text-gray-500">在本地 PostgreSQL / Supabase 镜像上生成只读 SQL 和 Vega 图表。</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-3 space-y-4">
          <Card title="数据源">
            <div className="space-y-3">
              {dataSources.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  disabled={!source.available}
                  onClick={() => setSelectedDataSourceId(source.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedDataSourceId === source.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Database size={16} />
                    {source.label}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{source.description}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card title="可选表">
            <div className="space-y-2">
              {tables.map((table) => (
                <label key={table.name} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 p-3 hover:border-gray-200">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={selectedTables.includes(table.name)}
                    onChange={() => handleToggleTable(table.name)}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <Table2 size={15} />
                      {table.name}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {table.columns.slice(0, 4).map((column) => column.name).join(', ')}
                      {table.columns.length > 4 ? ' ...' : ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-6 space-y-4">
          <Card
            title="AI 生成工作区"
            actions={<span className="text-xs text-gray-500">只读 SQL + Vega-Lite</span>}
          >
            <div className="space-y-4">
              <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-4">
                {messages.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                    <Sparkles className="mx-auto mb-2 h-6 w-6 text-brand-500" />
                    先选择表，再告诉 AI 你想做什么分析或图表。
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-xl px-4 py-3 text-sm ${
                      message.role === 'user' ? 'ml-10 bg-brand-500 text-white' : 'mr-10 border border-gray-200 bg-white text-gray-800'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium opacity-80">
                      {message.role === 'assistant' ? <Bot size={14} /> : <Sparkles size={14} />}
                      {message.role === 'assistant' ? 'AI 助手' : '你'}
                    </div>
                    <p className="whitespace-pre-wrap leading-6">{message.content}</p>
                    {message.role === 'assistant' && !!message.parts?.length && (
                      <div className="mt-3 space-y-3">
                        {message.parts.map((part, partIndex) => {
                          if (part.type === 'text') {
                            return (
                              <div key={partIndex} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                                {part.text}
                              </div>
                            );
                          }

                          if (part.type === 'tool-runSql') {
                            const rows = part.output?.data ?? [];
                            return (
                              <div key={partIndex} className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                                <div className="font-semibold">工具调用: runSql</div>
                                <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-3 text-[11px] text-slate-100">
                                  {part.input.sql}
                                </pre>
                                {part.state === 'output-error' ? (
                                  <div className="mt-2 flex items-center gap-2 text-red-700">
                                    <AlertCircle size={14} />
                                    {part.errorText}
                                  </div>
                                ) : (
                                  <div className="mt-2 text-blue-800">
                                    返回 {rows.length} 行{rows.length > 0 ? '，已用于后续生成图表' : ''}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          const generatedView = part.output?.data;
                          return (
                            <div key={partIndex} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                              <div className="font-semibold">工具调用: generateView</div>
                              {part.state === 'output-error' ? (
                                <div className="mt-2 flex items-center gap-2 text-red-700">
                                  <AlertCircle size={14} />
                                  {part.errorText}
                                </div>
                              ) : (
                                <div className="mt-2 space-y-2">
                                  <div className="font-medium">{generatedView?.title ?? part.input.title}</div>
                                  {(generatedView?.description ?? part.input.description) && (
                                    <div className="text-emerald-800">{generatedView?.description ?? part.input.description}</div>
                                  )}
                                  <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-[11px] text-slate-100">
                                    {generatedView?.querySql ?? part.input.query_sql}
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {message.view && (
                      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                        <div className="font-semibold text-gray-900">{message.view.title}</div>
                        <div className="mt-1 text-gray-500">{message.view.description}</div>
                        <pre className="mt-3 overflow-x-auto rounded bg-gray-900 p-3 text-[11px] text-gray-100">
                          {message.view.querySql}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2"
                  placeholder="例如：按平台和内容类型生成分布图，并挑一个适合首页展示的图表"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">已选 {selectedTables.length} 张表</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={loading || !selectedTables.length || !input.trim()}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {loading ? '生成中...' : '发送给 AI'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveView}
                      disabled={!latestDraft}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
                    >
                      <Save size={15} />
                      保存视图
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="图表预览">
            {!latestDraft ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                AI 生成视图后，这里会显示 SQL 结果和 Vega 图表预览。
              </div>
            ) : queryError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{queryError}</div>
            ) : (
              <div className="space-y-4">
                {loading && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI 正在调用工具分析数据并生成最终视图...
                  </div>
                )}
                <VegaPreview spec={latestDraft.vizConfig} data={queryRows} />
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {(queryRows[0] ? Object.keys(queryRows[0]) : []).map((column) => (
                          <th key={column} className="px-3 py-2 text-left font-medium text-gray-500">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {queryRows.slice(0, 20).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.keys(queryRows[0] ?? {}).map((column) => (
                            <td key={column} className="px-3 py-2 text-gray-700">
                              {row[column] === null || row[column] === undefined ? '-' : String(row[column])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-3 space-y-4">
          <Card title="已保存视图">
            <div className="space-y-3">
              {savedViews.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                  还没有保存的 AI 视图。
                </div>
              )}
              {savedViews.map((view) => {
                const isEditing = editingViewId === view.id;

                return (
                  <div key={view.id} className="rounded-lg border border-gray-100 p-3 hover:border-gray-200">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            value={editingViewTitle}
                            onChange={(event) => setEditingViewTitle(event.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-medium text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDataSourceId(view.dataSourceId);
                              setSelectedTables(view.selectedTables);
                              setMessages([
                                {
                                  role: 'assistant',
                                  content: `已载入保存视图：${view.title}`,
                                  view,
                                },
                              ]);
                            }}
                            className="block w-full truncate text-left text-sm font-medium text-gray-900"
                            title={view.title}
                          >
                            {view.title}
                          </button>
                        )}
                        <div className="mt-1 line-clamp-2 text-xs text-gray-500">{view.description || '无描述'}</div>
                        <div className="mt-2 text-[11px] text-gray-400">{new Date(view.createdAt).toLocaleString('zh-CN')}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
                              onClick={() => void handleRenameSavedView(view.id)}
                              disabled={editingViewTitle.trim().length === 0}
                              title="保存标题"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              type="button"
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                              onClick={() => {
                                setEditingViewId(null);
                                setEditingViewTitle('');
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
                              onClick={() => {
                                setEditingViewId(view.id);
                                setEditingViewTitle(view.title);
                              }}
                              title="修改标题"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              onClick={() => void handleDeleteSavedView(view.id)}
                              title="删除视图"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <AdminPasswordDialog
        open={adminDialogOpen}
        onClose={() => setAdminDialogOpen(false)}
        onVerified={async () => {
          await performSave();
        }}
      />
    </div>
  );
}
