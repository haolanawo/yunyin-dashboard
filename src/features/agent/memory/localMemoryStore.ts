import fs from 'fs/promises';
import path from 'path';
import type { MemoryRecord } from '../types';

const memoryDir = path.resolve(process.cwd(), '..', 'data', 'agent_memory');
const memoryFile = path.join(memoryDir, 'memories.json');

async function ensureStore() {
  await fs.mkdir(memoryDir, { recursive: true });
  try {
    await fs.access(memoryFile);
  } catch {
    await fs.writeFile(memoryFile, '[]', 'utf-8');
  }
}

export async function readMemoryStore(): Promise<MemoryRecord[]> {
  await ensureStore();
  const content = await fs.readFile(memoryFile, 'utf-8');
  return JSON.parse(content) as MemoryRecord[];
}

export async function writeMemoryStore(records: MemoryRecord[]) {
  await ensureStore();
  await fs.writeFile(memoryFile, JSON.stringify(records, null, 2), 'utf-8');
}
