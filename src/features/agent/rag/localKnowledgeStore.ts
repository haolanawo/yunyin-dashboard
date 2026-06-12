import fs from 'fs/promises';
import path from 'path';
import type { RetrievalItem } from '../types';

const knowledgeRoots = ['reports', 'analysis_output', 'openspec/specs'];

async function collectFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }
    if (/\.(md|txt|json)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function scoreSnippet(content: string, queryTerms: string[]) {
  const lower = content.toLowerCase();
  return queryTerms.reduce((score, term) => score + (lower.includes(term) ? 1 : 0), 0);
}

export async function retrieveFromLocalKnowledge(question: string): Promise<RetrievalItem[]> {
  const repoRoot = path.resolve(process.cwd(), '..');
  const queryTerms = question
    .toLowerCase()
    .split(/[\s,，。？?！!]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .slice(0, 10);

  const allFiles = (
    await Promise.all(
      knowledgeRoots.map((relativeRoot) => collectFiles(path.join(repoRoot, relativeRoot)).catch(() => [])),
    )
  ).flat();

  const results: RetrievalItem[] = [];

  for (const file of allFiles) {
    const content = await fs.readFile(file, 'utf-8').catch(() => '');
    if (!content) {
      continue;
    }
    const score = scoreSnippet(content, queryTerms);
    if (score === 0) {
      continue;
    }
    const firstLine = content.split(/\r?\n/).find((line) => line.trim()) ?? path.basename(file);
    results.push({
      sourceFile: path.relative(repoRoot, file),
      title: firstLine.replace(/^#+\s*/, '').slice(0, 120),
      snippet: content.slice(0, 240).replace(/\s+/g, ' ').trim(),
      score,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 6);
}
