import 'server-only';

import type {
  AiAgentPart,
  GenerateViewResponse,
  GeneratedViewDraft,
  QueryResultRow,
  TableSchema,
  ToolGenerateViewResult,
  ToolRunSqlResult,
} from '@/features/ai-dashboard/types';
import { executeAiDashboardQuery } from './queryService';
import { getAiConfig } from './aiConfigProvider';
import { validateReadonlySql } from './sqlSafety';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface DeepSeekToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface DeepSeekResponse {
  choices?: Array<{
    message?: DeepSeekMessage;
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
  };
}

function normalizeJson(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function toDraft(input: {
  title: string;
  description?: string;
  query_sql: string;
  viz_config: string;
  layout_w?: number;
  layout_h?: number;
  layout_order?: number;
}): GeneratedViewDraft {
  const vizConfig = JSON.parse(normalizeJson(input.viz_config)) as Record<string, unknown>;
  const draft: GeneratedViewDraft = {
    title: input.title.trim(),
    description: input.description?.trim(),
    querySql: input.query_sql.trim(),
    vizConfig,
    layoutW: input.layout_w ?? 2,
    layoutH: input.layout_h ?? 2,
    layoutOrder: input.layout_order ?? 0,
  };
  validateDraft(draft);
  return draft;
}

function validateDraft(draft: GeneratedViewDraft) {
  validateReadonlySql(draft.querySql);

  if (!draft.title) {
    throw new Error('Generated view title is empty.');
  }

  if (!draft.vizConfig || typeof draft.vizConfig !== 'object') {
    throw new Error('Generated vizConfig is invalid.');
  }
}

function buildSystemPrompt(selectedTables: string[], schemas: TableSchema[]) {
  const schemaText = schemas
    .filter((schema) => selectedTables.includes(schema.name))
    .map((schema) => {
      const cols = schema.columns
        .map((column) => `- ${column.name}: ${column.dataType}${column.isNullable ? ' nullable' : ''}`)
        .join('\n');
      return `Table ${schema.name}\n${cols}`;
    })
    .join('\n\n');

  return [
    '你是一个专业的数据分析师和可视化助手。',
    '你的任务不是直接空谈，而是需要在必要时调用工具探索数据，再生成最终图表。',
    '工作流程：理解需求 -> 必要时调用 runSql 查看数据 -> 调用 generateView 产出最终视图。',
    '如果你还不了解字段分布、枚举值、时间范围、空值情况，请先调用 runSql，不要直接猜。',
    'runSql 只允许 SELECT / WITH，只读，不允许任何写操作。',
    '除非是聚合统计，否则查询默认带 LIMIT。',
    '最终必须通过 generateView 输出视图，不能只在普通文本里描述图表方案。',
    '一次只生成一个视图。',
    'generateView 中的 viz_config 必须是标准 Vega-Lite JSON 字符串。',
    'viz_config 的 data 固定为 {"values": []}，字段名必须与 query_sql 返回列名完全一致。',
    `当前选择的数据表：${selectedTables.join(', ')}`,
    '以下是可用表结构：',
    schemaText,
  ].join('\n');
}

function getTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'runSql',
        description: '执行只读 SQL 查询来检查数据分布、样例、聚合结果。',
        parameters: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: '要执行的只读 SQL，必须是 SELECT 或 WITH 查询。',
            },
          },
          required: ['sql'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generateView',
        description: '生成最终的图表配置和查询。',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            query_sql: { type: 'string' },
            viz_config: {
              type: 'string',
              description: 'Vega-Lite JSON 字符串，data 必须为 {"values": []}。',
            },
            layout_w: { type: 'number' },
            layout_h: { type: 'number' },
            layout_order: { type: 'number' },
          },
          required: ['title', 'query_sql', 'viz_config'],
          additionalProperties: false,
        },
      },
    },
  ];
}

async function callDeepSeek(messages: DeepSeekMessage[]) {
  const { apiKey, baseUrl, model } = getAiConfig();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 2200,
      messages,
      tools: getTools(),
      tool_choice: 'auto',
    }),
    cache: 'no-store',
  });

  const payload = (await response.json()) as DeepSeekResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'DeepSeek request failed.');
  }

  const message = payload.choices?.[0]?.message;
  if (!message) {
    throw new Error('DeepSeek returned an empty completion.');
  }

  return message;
}

function summarizeRows(rows: QueryResultRow[]) {
  return rows.slice(0, 10);
}

async function executeToolCall(
  toolCall: DeepSeekToolCall,
  dataSourceId: 'supabase',
): Promise<{
  part: AiAgentPart;
  toolMessage: DeepSeekMessage;
  generatedView?: GeneratedViewDraft;
}> {
  const args = JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>;

  if (toolCall.function.name === 'runSql') {
    const sql = String(args.sql ?? '');
    const partBase: AiAgentPart = {
      type: 'tool-runSql',
      state: 'input-available',
      input: { sql },
    };

    try {
      const rows = await executeAiDashboardQuery(dataSourceId, sql);
      const output: ToolRunSqlResult = { success: true, data: rows };
      return {
        part: {
          ...partBase,
          state: 'output-available',
          output,
        },
        toolMessage: {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            success: true,
            rowCount: rows.length,
            sample: summarizeRows(rows),
          }),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SQL query failed.';
      return {
        part: {
          ...partBase,
          state: 'output-error',
          errorText: message,
          output: { success: false, error: message },
        },
        toolMessage: {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: false, error: message }),
        },
      };
    }
  }

  if (toolCall.function.name === 'generateView') {
    const input = {
      title: String(args.title ?? ''),
      description: typeof args.description === 'string' ? args.description : undefined,
      query_sql: String(args.query_sql ?? ''),
      viz_config: String(args.viz_config ?? ''),
      layout_w: typeof args.layout_w === 'number' ? args.layout_w : undefined,
      layout_h: typeof args.layout_h === 'number' ? args.layout_h : undefined,
      layout_order: typeof args.layout_order === 'number' ? args.layout_order : undefined,
    };

    const partBase: AiAgentPart = {
      type: 'tool-generateView',
      state: 'input-available',
      input,
    };

    try {
      const draft = toDraft(input);
      const output: ToolGenerateViewResult = {
        success: true,
        message: '视图配置已生成',
        data: draft,
      };
      return {
        part: {
          ...partBase,
          state: 'output-available',
          output,
        },
        toolMessage: {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: true, message: '视图配置已生成' }),
        },
        generatedView: draft,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'View generation failed.';
      return {
        part: {
          ...partBase,
          state: 'output-error',
          errorText: message,
          output: { success: false, error: message },
        },
        toolMessage: {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: false, error: message }),
        },
      };
    }
  }

  throw new Error(`Unsupported tool: ${toolCall.function.name}`);
}

export async function generateAiView(params: {
  dataSourceId: 'supabase';
  selectedTables: string[];
  schemas: TableSchema[];
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<GenerateViewResponse> {
  const transcript: AiAgentPart[] = [];
  const chatMessages: DeepSeekMessage[] = [
    {
      role: 'system',
      content: buildSystemPrompt(params.selectedTables, params.schemas),
    },
    ...params.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  let assistantMessage = '';
  let finalView: GeneratedViewDraft | null = null;

  for (let step = 0; step < 6; step += 1) {
    const assistant = await callDeepSeek(chatMessages);
    const text = assistant.content?.trim();
    const toolCalls = assistant.tool_calls ?? [];

    if (text) {
      transcript.push({ type: 'text', text });
      assistantMessage = text;
    }

    chatMessages.push({
      role: 'assistant',
      content: assistant.content ?? '',
      tool_calls: toolCalls,
    });

    if (!toolCalls.length) {
      if (finalView) {
        return {
          assistantMessage: assistantMessage || '已生成图表视图。',
          view: finalView,
          parts: transcript,
        };
      }
      continue;
    }

    for (const toolCall of toolCalls) {
      const result = await executeToolCall(toolCall, params.dataSourceId);
      transcript.push(result.part);
      chatMessages.push(result.toolMessage);
      if (result.generatedView) {
        finalView = result.generatedView;
      }
    }

    if (finalView) {
      return {
        assistantMessage: assistantMessage || '已根据数据生成图表视图。',
        view: finalView,
        parts: transcript,
      };
    }
  }

  if (!finalView) {
    throw new Error('AI 未按要求调用 generateView 生成最终视图。');
  }

  return {
    assistantMessage: assistantMessage || '已生成图表视图。',
    view: finalView,
    parts: transcript,
  };
}
