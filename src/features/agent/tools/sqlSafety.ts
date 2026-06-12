const blockedSqlPatterns = [
  /\bdrop\b/i,
  /\bdelete\b/i,
  /\bupdate\b/i,
  /\binsert\b/i,
  /\balter\b/i,
  /\btruncate\b/i,
  /\bcreate\b/i,
  /\bgrant\b/i,
  /\brevoke\b/i,
];

export function assertReadOnlySql(sql: string) {
  const normalized = sql.trim();

  if (!/^(select|with)\b/i.test(normalized)) {
    throw new Error('SQL tool only allows SELECT or WITH statements.');
  }

  for (const pattern of blockedSqlPatterns) {
    if (pattern.test(normalized)) {
      throw new Error(`Blocked dangerous SQL pattern: ${pattern}`);
    }
  }
}
