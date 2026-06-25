import 'server-only';

const MUTATION_PATTERN =
  /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|call|merge|refresh|vacuum)\b/i;

export function validateReadonlySql(sql: string) {
  const trimmed = sql.trim();
  if (!trimmed) {
    throw new Error('SQL is required.');
  }

  const normalized = trimmed.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '').trim();
  if (!/^(select|with)\b/i.test(normalized)) {
    throw new Error('Only SELECT queries are allowed.');
  }

  if (normalized.split(';').filter(Boolean).length > 1) {
    throw new Error('Only a single SQL statement is allowed.');
  }

  if (MUTATION_PATTERN.test(normalized)) {
    throw new Error('Mutating SQL statements are not allowed.');
  }
}
