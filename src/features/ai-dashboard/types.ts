export interface AiDataSource {
  id: 'supabase';
  label: string;
  description: string;
  available: boolean;
  queryBackend: 'supabase';
}

export interface TableColumn {
  name: string;
  dataType: string;
  isNullable: boolean;
}

export interface TableSchema {
  name: string;
  columns: TableColumn[];
}

export interface QueryResultRow {
  [key: string]: unknown;
}

export interface GeneratedViewDraft {
  title: string;
  description?: string;
  querySql: string;
  vizConfig: Record<string, unknown>;
  layoutW: number;
  layoutH: number;
  layoutOrder: number;
}

export interface ToolRunSqlResult {
  success: boolean;
  data?: QueryResultRow[];
  error?: string;
}

export interface ToolGenerateViewResult {
  success: boolean;
  message?: string;
  data?: GeneratedViewDraft;
  error?: string;
}

export type AiAgentPart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'tool-runSql';
      state: 'input-available' | 'output-available' | 'output-error';
      input: {
        sql: string;
      };
      output?: ToolRunSqlResult;
      errorText?: string;
    }
  | {
      type: 'tool-generateView';
      state: 'input-available' | 'output-available' | 'output-error';
      input: {
        title: string;
        description?: string;
        query_sql: string;
        viz_config: string;
        layout_w?: number;
        layout_h?: number;
        layout_order?: number;
      };
      output?: ToolGenerateViewResult;
      errorText?: string;
    };

export interface GenerateViewResponse {
  assistantMessage: string;
  view: GeneratedViewDraft | null;
  parts: AiAgentPart[];
}

export interface SavedView extends GeneratedViewDraft {
  id: string;
  dataSourceId: AiDataSource['id'];
  selectedTables: string[];
  createdAt: string;
}
