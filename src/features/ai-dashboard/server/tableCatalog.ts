import 'server-only';

export const TABLE_CATALOG = [
  'zhihu_accounts',
  'bilibili_accounts',
  'contents',
  'metrics_daily',
  'structural_labels',
  'writing_rules',
  'content_metric_snapshots',
  'crawler_runs',
] as const;

export type CatalogTableName = (typeof TABLE_CATALOG)[number];
