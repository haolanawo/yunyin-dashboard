import 'server-only';

import { queryLocalDb } from '@/lib/local-db';
import { supabaseRpc } from '@/lib/server/supabaseRest';

export type TrendPlatform = 'zhihu' | 'bilibili';
export type AnalyticsPlatform = 'zhihu' | 'bilibili';

export interface PlatformDist {
  platform: string;
  count: number;
  likes: number;
  traffic: number;
}

export interface MetricTrendPoint {
  date: string;
  label: string;
  likes: number;
  comments: number;
  hasObservation: boolean;
}

export interface TopContent {
  content_id: string;
  title: string | null;
  platform: string;
  votes: number;
  publish_date: string | null;
}

export interface AccountComparisonItem {
  account_name: string;
  content_count: number;
  total_votes: number;
}

export interface RecentContent {
  content_id: string;
  title: string;
  platform: string;
  publish_date: string;
  account_name: string;
}

export interface PlatformOverview {
  platform: AnalyticsPlatform;
  label: string;
  accounts: number;
  contents: number;
  views: number;
  likes: number;
  comments: number;
  favorites: number;
  coins: number;
  shares: number;
  danmaku: number;
  interactions: number;
  contentShare: number;
  interactionShare: number;
  avgInteractionPerContent: number;
  contentPerAccount: number;
  likeRate: number;
  commentRate: number;
  interactionRate: number;
}

export interface ExecutiveOverview {
  platformCount: number;
  accountCount: number;
  contentCount: number;
  totalViews: number;
  totalInteractions: number;
  totalLikes: number;
  totalComments: number;
  avgInteractionPerContent: number;
  contentPerAccount: number;
  interactionRate: number;
  bilibiliViewShare: number;
  platforms: PlatformOverview[];
}

export interface TrendAccountOption {
  account_id: string;
  account_name: string;
}

export interface AccountTrendPoint {
  account_id: string;
  account_name: string;
  date: string;
  traffic: number;
  trafficDaily: number | null;
  interactionRate: number;
  hasObservation: boolean;
}

export interface BilibiliOverview {
  videoCounts: Array<{ account_id: string; account_name: string; count: number }>;
  viewRanking: Array<{ account_id: string; account_name: string; total_views: number }>;
  interactions: Array<{
    account_id: string;
    account_name: string;
    total_likes: number;
    total_favorites: number;
    total_coins: number;
    total_shares: number;
    total_danmaku: number;
    total_comments: number;
    total_views: number;
    interaction_rate: number;
  }>;
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function dateLabel(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export async function getPlatformDistribution(): Promise<PlatformDist[]> {
  const rows = await supabaseRpc<Array<PlatformDist>>('get_platform_distribution');
  return rows.map((row) => ({
    platform: row.platform,
    count: Number(row.count),
    likes: Number(row.likes),
    traffic: Number(row.traffic),
  }));
}

export async function getMetricTrend(platform: AnalyticsPlatform): Promise<MetricTrendPoint[]> {
  const rows = await supabaseRpc<Array<{
    date: string;
    likes: string;
    comments: string;
  }>>('get_metric_trend', { p_platform: platform });

  return rows.map((row) => ({
    date: row.date,
    label: dateLabel(row.date),
    likes: Number(row.likes),
    comments: Number(row.comments),
    hasObservation: true,
  }));
}

export async function getTopContents(limit: number): Promise<TopContent[]> {
  const rows = await supabaseRpc<Array<TopContent & { votes: string }>>('get_top_contents', { p_limit: limit });
  return rows.map((row) => ({
    ...row,
    votes: Number(row.votes),
  }));
}

export async function getAccountComparison(): Promise<AccountComparisonItem[]> {
  const rows = await supabaseRpc<Array<{
    account_name: string | null;
    content_count: string;
    total_votes: string;
  }>>('get_account_comparison');

  return rows.map((row) => ({
    account_name: row.account_name ?? 'unknown',
    content_count: Number(row.content_count),
    total_votes: Number(row.total_votes),
  }));
}

export async function getRecentContents(limit: number): Promise<RecentContent[]> {
  const rows = await supabaseRpc<Array<{
    content_id: string;
    title: string | null;
    platform: string | null;
    publish_date: string | null;
    account_name: string | null;
  }>>('get_recent_contents', { p_limit: limit });

  return rows.map((row) => ({
    content_id: row.content_id,
    title: row.title?.trim() || `未命名内容 ${row.content_id}`,
    platform: row.platform ?? 'unknown',
    publish_date: row.publish_date ?? '日期待补',
    account_name: row.account_name ?? '未知账号',
  }));
}

export async function getExecutiveOverview(): Promise<ExecutiveOverview> {
  return supabaseRpc<ExecutiveOverview>('get_executive_overview_json');
}

export async function getTrendAccounts(platform: TrendPlatform): Promise<TrendAccountOption[]> {
  return supabaseRpc<TrendAccountOption[]>('get_trend_accounts', { p_platform: platform });
}

export async function getTrendSeries(
  platform: TrendPlatform,
  accountIds: string[],
  dateRange: { start: string; end: string },
): Promise<AccountTrendPoint[]> {
  if (!accountIds.length) return [];

  if (platform === 'bilibili') {
    const result = await queryLocalDb<{
      account_id: string;
      account_name: string;
      date: string;
      traffic: string;
      traffic_daily: string | null;
      interaction_rate: string;
      has_observation: boolean;
    }>(
      `
      with date_quality as (
        select
          snapshot_date,
          count(*) as row_count,
          sum(coalesce(comments, 0)) as total_comments
        from content_metric_snapshots
        where platform = 'bilibili'
          and snapshot_date between ($2::date - interval '30 days') and $3::date
        group by snapshot_date
      ),
      snapshots as (
        select
          c.account_id,
          coalesce(ba.account_name, c.account_id, 'unknown') as account_name,
          s.content_id,
          s.snapshot_date,
          coalesce(s.views, 0)::bigint as views,
          coalesce(s.likes, 0)::bigint as likes,
          coalesce(s.favorites, 0)::bigint as favorites,
          coalesce(s.coins, 0)::bigint as coins,
          coalesce(s.shares, 0)::bigint as shares,
          coalesce(s.comments, 0)::bigint as comments,
          coalesce(s.danmaku, 0)::bigint as danmaku,
          not (dq.row_count >= 20 and dq.total_comments = 0) as has_observation
        from content_metric_snapshots s
        join contents c on c.content_id = s.content_id
        left join bilibili_accounts ba on ba.account_id = c.account_id
        join date_quality dq on dq.snapshot_date = s.snapshot_date
        where s.platform = 'bilibili'
          and c.account_id = any($1::text[])
          and s.snapshot_date between ($2::date - interval '30 days') and $3::date
      ),
      account_daily as (
        select
          account_id,
          account_name,
          snapshot_date,
          sum(views)::bigint as traffic,
          sum(likes + favorites + coins + shares + comments + danmaku)::numeric / nullif(sum(views), 0) as interaction_rate,
          bool_and(has_observation) as has_observation
        from snapshots
        group by account_id, account_name, snapshot_date
      ),
      valid_content as (
        select
          account_id,
          content_id,
          snapshot_date,
          views,
          lag(views) over (partition by content_id order by snapshot_date) as previous_views
        from snapshots
        where has_observation
      ),
      content_delta as (
        select
          account_id,
          snapshot_date,
          case
            when previous_views is null then null
            else greatest(views - previous_views, 0)
          end as traffic_delta
        from valid_content
      ),
      daily_delta as (
        select
          account_id,
          snapshot_date,
          sum(traffic_delta)::bigint as traffic_daily
        from content_delta
        where traffic_delta is not null
        group by account_id, snapshot_date
      )
      select
        ad.account_id,
        ad.account_name,
        ad.snapshot_date::text as date,
        ad.traffic::text as traffic,
        dd.traffic_daily::text as traffic_daily,
        coalesce(ad.interaction_rate, 0)::text as interaction_rate,
        ad.has_observation
      from account_daily ad
      left join daily_delta dd on dd.account_id = ad.account_id and dd.snapshot_date = ad.snapshot_date
      where ad.snapshot_date between $2::date and $3::date
      order by ad.snapshot_date asc, ad.account_name asc
      `,
      [accountIds, dateRange.start, dateRange.end],
    );

    return result.rows.map((row) => ({
      account_id: row.account_id,
      account_name: row.account_name,
      date: row.date,
      traffic: Number(row.traffic),
      trafficDaily: row.traffic_daily == null ? null : Number(row.traffic_daily),
      interactionRate: Number(row.interaction_rate),
      hasObservation: row.has_observation,
    }));
  }

  const rows = await supabaseRpc<Array<{
    account_id: string;
    account_name: string;
    date: string;
    traffic: string;
    interaction_rate: string;
  }>>('get_trend_series', {
    p_platform: platform,
    p_account_ids: accountIds,
    p_start: dateRange.start,
    p_end: dateRange.end,
  });

  return rows.map((row) => ({
    account_id: row.account_id,
    account_name: row.account_name,
    date: row.date,
    traffic: Number(row.traffic),
    trafficDaily: null,
    interactionRate: Number(row.interaction_rate),
    hasObservation: true,
  }));
}

export async function getBilibiliOverview(): Promise<BilibiliOverview> {
  return supabaseRpc<BilibiliOverview>('get_bilibili_overview_json');
}
