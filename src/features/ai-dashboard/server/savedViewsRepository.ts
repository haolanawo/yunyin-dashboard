import 'server-only';

import crypto from 'node:crypto';
import type { QueryResultRow } from 'pg';
import { queryLocalDb } from '@/lib/local-db';
import type { GeneratedViewDraft, SavedView, AiDataSource } from '@/features/ai-dashboard/types';

interface SavedViewRow extends QueryResultRow {
  id: string;
  data_source_id: string;
  selected_tables: unknown;
  title: string;
  description: string | null;
  query_sql: string;
  viz_config: unknown;
  layout_w: number;
  layout_h: number;
  layout_order: number;
  created_at: string;
}

let ensureStorePromise: Promise<void> | null = null;

function parseStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function parseVizConfig(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function mapRowToSavedView(row: SavedViewRow): SavedView {
  return {
    id: row.id,
    dataSourceId: 'supabase',
    selectedTables: parseStringArray(row.selected_tables),
    title: row.title,
    description: row.description ?? undefined,
    querySql: row.query_sql,
    vizConfig: parseVizConfig(row.viz_config),
    layoutW: Number(row.layout_w),
    layoutH: Number(row.layout_h),
    layoutOrder: Number(row.layout_order),
    createdAt: row.created_at,
  };
}

async function ensureStore() {
  if (!ensureStorePromise) {
    ensureStorePromise = (async () => {
      await queryLocalDb(`
        create schema if not exists private;

        create table if not exists private.ai_dashboard_saved_views (
          id uuid primary key,
          data_source_id text not null default 'supabase',
          selected_tables jsonb not null default '[]'::jsonb,
          title text not null,
          description text,
          query_sql text not null,
          viz_config jsonb not null,
          layout_w integer not null,
          layout_h integer not null,
          layout_order integer not null,
          created_at timestamptz not null default now()
        );

        create index if not exists idx_ai_dashboard_saved_views_created_at
          on private.ai_dashboard_saved_views (created_at desc);
      `);
    })().catch((error) => {
      ensureStorePromise = null;
      throw error;
    });
  }

  await ensureStorePromise;
}

export async function listSavedViews() {
  await ensureStore();
  const result = await queryLocalDb<SavedViewRow>(`
    select
      id::text,
      data_source_id,
      selected_tables,
      title,
      description,
      query_sql,
      viz_config,
      layout_w,
      layout_h,
      layout_order,
      created_at::text
    from private.ai_dashboard_saved_views
    order by created_at desc
  `);

  return result.rows.map(mapRowToSavedView);
}

export async function createSavedView(input: {
  dataSourceId: AiDataSource['id'];
  selectedTables: string[];
  draft: GeneratedViewDraft;
}) {
  await ensureStore();
  const id = crypto.randomUUID();
  const result = await queryLocalDb<SavedViewRow>(
    `
      insert into private.ai_dashboard_saved_views (
        id,
        data_source_id,
        selected_tables,
        title,
        description,
        query_sql,
        viz_config,
        layout_w,
        layout_h,
        layout_order
      )
      values ($1::uuid, $2, $3::jsonb, $4, $5, $6, $7::jsonb, $8, $9, $10)
      returning
        id::text,
        data_source_id,
        selected_tables,
        title,
        description,
        query_sql,
        viz_config,
        layout_w,
        layout_h,
        layout_order,
        created_at::text
    `,
    [
      id,
      input.dataSourceId,
      JSON.stringify(input.selectedTables),
      input.draft.title,
      input.draft.description ?? null,
      input.draft.querySql,
      JSON.stringify(input.draft.vizConfig),
      input.draft.layoutW,
      input.draft.layoutH,
      input.draft.layoutOrder,
    ],
  );

  const savedView = result.rows[0];
  if (!savedView) {
    throw new Error('Failed to save AI dashboard view.');
  }

  return mapRowToSavedView(savedView);
}

export async function deleteSavedView(id: string) {
  await ensureStore();
  await queryLocalDb(
    `
      delete from private.ai_dashboard_saved_views
      where id = $1::uuid
    `,
    [id],
  );
}

export async function renameSavedView(id: string, title: string) {
  await ensureStore();
  const result = await queryLocalDb<SavedViewRow>(
    `
      update private.ai_dashboard_saved_views
      set title = $2
      where id = $1::uuid
      returning
        id::text,
        data_source_id,
        selected_tables,
        title,
        description,
        query_sql,
        viz_config,
        layout_w,
        layout_h,
        layout_order,
        created_at::text
    `,
    [id, title],
  );

  const savedView = result.rows[0];
  if (!savedView) {
    throw new Error('Saved view not found.');
  }

  return mapRowToSavedView(savedView);
}
