import type { AnalyticsToolInput, AnalyticsToolResult } from '../types';
import { queryLocalDb } from '@/lib/local-db';

interface AnalyticsOverviewRow {
  platform: string;
  sample_count: number | string;
  avg_views: number | string | null;
  avg_likes: number | string | null;
  avg_new_followers: number | string | null;
  avg_content_score: number | string | null;
  top_topic: string | null;
}

export async function runAnalyticsTool(input: AnalyticsToolInput): Promise<AnalyticsToolResult> {
  const platform = input.platform && input.platform !== 'cross_platform' ? input.platform : null;
  const result = await queryLocalDb<AnalyticsOverviewRow>(`
    with latest_snapshots as (
      select *
      from (
        select
          s.*,
          row_number() over (partition by s.content_id order by s.snapshot_date desc) as rn
        from content_metric_snapshots s
      ) ranked
      where rn = 1
    ),
    latest_zhihu_metrics as (
      select *
      from (
        select
          m.*,
          row_number() over (partition by m.content_id order by m.snapshot_date desc) as rn
        from metrics_daily m
      ) ranked
      where rn = 1
    ),
    base as (
      select
        c.platform,
        coalesce(s.views, c.play_count, 0)::numeric as views,
        coalesce(s.likes, c.like_count, m.votes, 0)::numeric as likes,
        0::numeric as new_followers,
        coalesce(sl.ai_score, 0)::numeric as ai_score,
        coalesce(sl.topic_types[1], sl.hook_type, c.content_type, '未标注') as topic_type,
        (
          coalesce(s.views, c.play_count, 0)::numeric / 1000 +
          coalesce(s.likes, c.like_count, m.votes, 0)::numeric +
          coalesce(s.comments, m.comments, 0)::numeric * 2 +
          coalesce(sl.ai_score, 0)::numeric
        ) as content_score
      from contents c
      left join latest_snapshots s on s.content_id = c.content_id
      left join latest_zhihu_metrics m on m.content_id = c.content_id
      left join structural_labels sl on sl.content_id = c.content_id
      where ($1::text is null or c.platform = $1)
    ),
    topic_rank as (
      select
        platform,
        topic_type,
        count(*) as topic_count,
        row_number() over (partition by platform order by count(*) desc, topic_type asc nulls last) as rn
      from base
      where topic_type is not null
      group by platform, topic_type
    )
    select
      b.platform,
      count(*)::int as sample_count,
      avg(coalesce(b.views, 0)) as avg_views,
      avg(coalesce(b.likes, 0)) as avg_likes,
      avg(coalesce(b.new_followers, 0)) as avg_new_followers,
      avg(coalesce(b.content_score, 0)) as avg_content_score,
      max(t.topic_type) filter (where t.rn = 1) as top_topic
    from base b
    left join topic_rank t on t.platform = b.platform and t.rn = 1
    group by b.platform
    order by avg_content_score desc nulls last;
  `, [platform]);

  const highlights = result.rows.map((row) => {
    const sampleCount = Number(row.sample_count);
    const avgViews = Math.round(Number(row.avg_views ?? 0));
    const avgLikes = Math.round(Number(row.avg_likes ?? 0));
    const avgFollowers = Number(row.avg_new_followers ?? 0).toFixed(2);
    const avgScore = Number(row.avg_content_score ?? 0).toFixed(2);
    return `${row.platform}: 样本 ${sampleCount} 条，平均浏览 ${avgViews}，平均点赞 ${avgLikes}，平均涨粉 ${avgFollowers}，平均分 ${avgScore}，高频主题 ${row.top_topic ?? '待补'}`;
  });

  return {
    source: 'contents + content_metric_snapshots + metrics_daily + structural_labels',
    summary:
      highlights.length > 0
        ? `基于 Supabase 主表生成 ${input.mode ?? 'overview'} 分析，覆盖 ${highlights.length} 个平台分组。`
        : 'Supabase 主表暂无可用于该条件的分析样本。',
    highlights,
    rawExcerpt: JSON.stringify(result.rows, null, 2).slice(0, 1200),
  };
}
