import type { AgentEvidence, RetrievalItem, SqlToolResult } from './types';

export function extractDayWindow(question: string) {
  const dayMatch = question.match(/(\d+)\s*天/);
  if (dayMatch) {
    return Number(dayMatch[1]);
  }

  if (question.includes('最近一周') || question.includes('近一周')) {
    return 7;
  }

  if (question.includes('最近一个月') || question.includes('近一个月')) {
    return 30;
  }

  return 30;
}

export function detectPlatform(question: string): 'zhihu' | 'bilibili' | 'cross_platform' {
  const normalized = question.toLowerCase();
  const hasZhihu = normalized.includes('知乎');
  const hasBilibili = normalized.includes('b站') || normalized.includes('bilibili');

  if (hasZhihu && !hasBilibili) {
    return 'zhihu';
  }

  if (hasBilibili && !hasZhihu) {
    return 'bilibili';
  }

  return 'cross_platform';
}

export function detectTopicHint(question: string) {
  const topicCandidates = ['AI 编程', 'AI编程', '编程', 'Agent', 'Claude', 'Codex', 'ChatGPT', 'Gemini', '提示词'];
  return topicCandidates.find((item) => question.toLowerCase().includes(item.toLowerCase())) ?? null;
}

export function summarizeSqlRows(sqlResult?: SqlToolResult) {
  if (!sqlResult || sqlResult.rowCount === 0) {
    return {
      sampleSummary: '结构化查询未返回足够样本，当前更适合输出“数据不足”而不是强结论。',
      sampleRows: [] as Array<Record<string, unknown>>,
      patternNotes: [] as string[],
    };
  }

  const sampleRows = sqlResult.rows.slice(0, 3);
  const patternNotes: string[] = [];
  const topicCounts = new Map<string, number>();
  const accountCounts = new Map<string, number>();

  for (const row of sqlResult.rows) {
    const topic = String(row.topic_type ?? row.content_type ?? '').trim();
    const account = String(row.account_name ?? '').trim();
    if (topic) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
    if (account) {
      accountCounts.set(account, (accountCounts.get(account) ?? 0) + 1);
    }
  }

  const topTopics = [...topicCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topAccounts = [...accountCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  if (topTopics.length > 0) {
    patternNotes.push(`高频主题/类型：${topTopics.map(([name, count]) => `${name}(${count})`).join('、')}`);
  }
  if (topAccounts.length > 0) {
    patternNotes.push(`高频账号：${topAccounts.map(([name, count]) => `${name}(${count})`).join('、')}`);
  }

  return {
    sampleSummary: `结构化查询命中 ${sqlResult.rowCount} 条样本，可作为当前结论的直接数据依据。`,
    sampleRows,
    patternNotes,
  };
}

export function summarizeRetrievalItems(items: RetrievalItem[]) {
  if (items.length === 0) {
    return '没有检索到可复用的历史报告或案例。';
  }

  return items
    .slice(0, 3)
    .map((item) => `${item.title}（${item.sourceFile}）`)
    .join('；');
}

export function buildEvidenceDigest(evidence: AgentEvidence[]) {
  return evidence
    .map((item) => {
      const rendered =
        typeof item.data === 'string'
          ? item.data.slice(0, 240)
          : JSON.stringify(item.data, null, 2).slice(0, 360);
      return `- [${item.type}] ${item.title}\n${rendered}`;
    })
    .join('\n\n');
}
