import type { SqlToolInput, SqlToolResult } from '../types';
import { assertReadOnlySql } from './sqlSafety';
import { pickSqlTemplate, sqlTemplates } from './sqlTemplates';
import { runPythonJsonScript } from './pythonBridge';

interface PythonSqlResult {
  sql: string;
  rows: Array<Record<string, unknown>>;
  rowCount: number;
}

export async function queryDatabaseTool(input: SqlToolInput): Promise<SqlToolResult> {
  const templateKey = input.template || pickSqlTemplate(input.question);
  const template = sqlTemplates[templateKey];

  if (!template) {
    throw new Error(`Unknown SQL template: ${templateKey}`);
  }

  assertReadOnlySql(template.sql);

  const result = (await runPythonJsonScript('scripts/agent/query_db.py', {
    sql: template.sql,
  })) as PythonSqlResult;

  return {
    sql: result.sql,
    rows: result.rows,
    rowCount: result.rowCount,
    summary:
      result.rowCount > 0
        ? `${template.summary} Returned ${result.rowCount} rows.`
        : `${template.summary} No rows returned, data may be insufficient.`,
  };
}
