export type AgentIntent =
  | 'trend_analysis'
  | 'competitor_research'
  | 'viral_content_analysis'
  | 'writing_strategy'
  | 'data_diagnosis'
  | 'general_strategy';

export type EvidenceType = 'sql' | 'content' | 'report' | 'analysis';

export interface AgentInput {
  question: string;
  userId?: string;
  context?: Record<string, unknown>;
}

export interface ToolCallTrace {
  toolName: string;
  input: unknown;
  outputSummary: string;
}

export interface AgentEvidence {
  type: EvidenceType;
  title: string;
  data: unknown;
}

export interface AgentResult {
  answer: string;
  intent: AgentIntent;
  toolCalls: ToolCallTrace[];
  evidence: AgentEvidence[];
  suggestions: string[];
}

export interface SkillContext {
  input: AgentInput;
  intent: AgentIntent;
  memorySummary?: string;
}

export interface SkillResult extends AgentResult {
  skillName: string;
}

export interface StrategySkill {
  name: string;
  description: string;
  whenToUse: string[];
  requiredTools: string[];
  run(input: SkillContext): Promise<SkillResult>;
}

export interface SqlToolInput {
  template: string;
  question: string;
  params?: Record<string, string | number | boolean | null | undefined>;
}

export interface SqlToolRow extends Record<string, unknown> {}

export interface SqlToolResult {
  sql: string;
  rows: SqlToolRow[];
  rowCount: number;
  summary: string;
}

export interface AnalyticsToolInput {
  question: string;
  platform?: 'zhihu' | 'bilibili' | 'cross_platform';
  mode?: 'overview' | 'zhihu_stats' | 'semantic';
}

export interface AnalyticsToolResult {
  source: string;
  summary: string;
  highlights: string[];
  rawExcerpt: string;
}

export interface RetrievalItem {
  sourceFile: string;
  title: string;
  snippet: string;
  score: number;
}

export interface RetrievalResult {
  items: RetrievalItem[];
  summary: string;
}

export interface MemoryRecord {
  id: string;
  userId?: string;
  question: string;
  answer: string;
  suggestions: string[];
  evidenceTitles: string[];
  createdAt: string;
}

export interface MultiAgentStep<T = unknown> {
  agent: 'research' | 'analytics' | 'strategy' | 'critic';
  output: T;
}
