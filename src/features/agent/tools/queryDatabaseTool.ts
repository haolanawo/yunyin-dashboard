import type { SqlToolInput, SqlToolResult } from '../types';
import { queryLocalDb } from '@/lib/local-db';
import { assertReadOnlySql } from './sqlSafety';
import { pickSqlTemplate, sqlTemplates } from './sqlTemplates';

export async function queryDatabaseTool(input: SqlToolInput): Promise<SqlToolResult> {
  const templateKey = input.template || pickSqlTemplate(input.question);
  const template = sqlTemplates[templateKey];

  if (!template) {
    throw new Error(`Unknown SQL template: ${templateKey}`);
  }

  assertReadOnlySql(template.sql);

  const result = await queryLocalDb(template.sql);
  const rowCount = result.rowCount ?? result.rows.length;

  return {
    sql: template.sql,
    rows: result.rows,
    rowCount,
    summary:
      rowCount > 0
        ? `${template.summary} Returned ${rowCount} rows.`
        : `${template.summary} No rows returned, data may be insufficient.`,
  };
}
