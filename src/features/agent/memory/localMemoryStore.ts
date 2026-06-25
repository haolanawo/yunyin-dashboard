import 'server-only';

import type { QueryResultRow } from 'pg';
import { queryLocalDb } from '@/lib/local-db';
import type { MemoryRecord } from '../types';

interface AgentSessionRow extends QueryResultRow {
  id: string;
  user_id: string | null;
  question: string;
  answer: string;
  suggestions: unknown;
  evidence_titles: unknown;
  created_at: string;
}

const MAX_MEMORY_ROWS = 200;
let ensureStorePromise: Promise<void> | null = null;

function normalizeQuestion(question: string) {
  return question.trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function mapRowToRecord(row: AgentSessionRow): MemoryRecord {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    question: row.question,
    answer: row.answer,
    suggestions: parseStringArray(row.suggestions),
    evidenceTitles: parseStringArray(row.evidence_titles),
    createdAt: row.created_at,
  };
}

async function ensureStore() {
  if (!ensureStorePromise) {
    ensureStorePromise = (async () => {
      await queryLocalDb(`
        create schema if not exists private;

        create table if not exists private.agent_sessions (
          id uuid primary key,
          user_id text,
          user_key text not null,
          question text not null,
          question_normalized text not null,
          answer text not null,
          suggestions jsonb not null default '[]'::jsonb,
          evidence_titles jsonb not null default '[]'::jsonb,
          created_at timestamptz not null default now()
        );

        create unique index if not exists uq_agent_sessions_user_question
          on private.agent_sessions (user_key, question_normalized);

        create index if not exists idx_agent_sessions_created_at
          on private.agent_sessions (created_at desc);
      `);
    })().catch((error) => {
      ensureStorePromise = null;
      throw error;
    });
  }

  await ensureStorePromise;
}

export async function readMemoryStore(limit = 20): Promise<MemoryRecord[]> {
  await ensureStore();
  const safeLimit = Math.max(1, Math.min(limit, MAX_MEMORY_ROWS));
  const result = await queryLocalDb<AgentSessionRow>(
    `
      select
        id::text,
        user_id,
        question,
        answer,
        suggestions,
        evidence_titles,
        created_at::text
      from private.agent_sessions
      order by created_at desc
      limit $1
    `,
    [safeLimit],
  );

  return result.rows.map(mapRowToRecord);
}

export async function upsertMemoryRecord(record: MemoryRecord) {
  await ensureStore();
  const userKey = record.userId ?? '';

  await queryLocalDb(
    `
      insert into private.agent_sessions (
        id,
        user_id,
        user_key,
        question,
        question_normalized,
        answer,
        suggestions,
        evidence_titles,
        created_at
      )
      values ($1::uuid, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::timestamptz)
      on conflict (user_key, question_normalized)
      do update set
        id = excluded.id,
        user_id = excluded.user_id,
        question = excluded.question,
        answer = excluded.answer,
        suggestions = excluded.suggestions,
        evidence_titles = excluded.evidence_titles,
        created_at = excluded.created_at
    `,
    [
      record.id,
      record.userId ?? null,
      userKey,
      record.question,
      normalizeQuestion(record.question),
      record.answer,
      JSON.stringify(record.suggestions),
      JSON.stringify(record.evidenceTitles),
      record.createdAt,
    ],
  );

  await queryLocalDb(
    `
      delete from private.agent_sessions
      where id not in (
        select id
        from private.agent_sessions
        order by created_at desc
        limit $1
      )
    `,
    [MAX_MEMORY_ROWS],
  );
}

export async function deleteMemoryRecord(id: string) {
  await ensureStore();
  await queryLocalDb(
    `
      delete from private.agent_sessions
      where id = $1::uuid
    `,
    [id],
  );
}

export async function renameMemoryRecord(id: string, question: string) {
  await ensureStore();
  const normalizedQuestion = normalizeQuestion(question);
  const result = await queryLocalDb<AgentSessionRow>(
    `
      update private.agent_sessions
      set
        question = $2,
        question_normalized = $3
      where id = $1::uuid
      returning
        id::text,
        user_id,
        question,
        answer,
        suggestions,
        evidence_titles,
        created_at::text
    `,
    [id, question, normalizedQuestion],
  );

  const record = result.rows[0];
  if (!record) {
    throw new Error('Agent session not found.');
  }

  return mapRowToRecord(record);
}
