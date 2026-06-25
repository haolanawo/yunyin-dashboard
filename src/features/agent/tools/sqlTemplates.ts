import { detectPlatform, extractDayWindow } from '../utils';

interface SqlTemplateDefinition {
  sql: string;
  summary: string;
}

const contentAnalysisCte = `
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
content_analysis as (
  select
    c.content_id,
    c.platform,
    c.title,
    coalesce(za.account_name, ba.account_name, c.account_id, 'unknown') as account_name,
    c.publish_date,
    coalesce(s.views, c.play_count, 0)::numeric as views,
    coalesce(s.likes, c.like_count, m.votes, 0)::numeric as likes,
    coalesce(s.comments, m.comments, 0)::numeric as comments,
    0::numeric as new_followers,
    coalesce(sl.topic_types[1], sl.hook_type, c.content_type, '未标注') as topic_type,
    0::numeric as follow_rate,
    (
      coalesce(s.views, c.play_count, 0)::numeric / 1000 +
      coalesce(s.likes, c.like_count, m.votes, 0)::numeric +
      coalesce(s.comments, m.comments, 0)::numeric * 2 +
      coalesce(sl.ai_score, 0)::numeric
    ) as content_score
  from contents c
  left join latest_snapshots s on s.content_id = c.content_id
  left join latest_zhihu_metrics m on m.content_id = c.content_id
  left join zhihu_accounts za on za.account_id = c.account_id or za.zhihu_uid = c.account_id
  left join bilibili_accounts ba on ba.account_id = c.account_id
  left join structural_labels sl on sl.content_id = c.content_id
)
`.trim();

export const sqlTemplates: Record<string, SqlTemplateDefinition> = {
  top_content_last_30_days: {
    summary: '最近 30 天高表现内容样本。',
    sql: `${contentAnalysisCte}
select
  platform,
  title,
  coalesce(account_name, 'unknown') as account_name,
  publish_date,
  views,
  likes,
  new_followers,
  topic_type,
  content_score
from content_analysis
where publish_date >= current_date - interval '30 day'
order by content_score desc nulls last, views desc nulls last
limit 15;
`.trim(),
  },
  top_content_last_7_days: {
    summary: '最近 7 天高表现内容样本。',
    sql: `${contentAnalysisCte}
select
  platform,
  title,
  coalesce(account_name, 'unknown') as account_name,
  publish_date,
  views,
  likes,
  new_followers,
  topic_type,
  content_score
from content_analysis
where publish_date >= current_date - interval '7 day'
order by content_score desc nulls last, views desc nulls last
limit 15;
`.trim(),
  },
  fastest_growing_accounts: {
    summary: '最近 30 天涨粉最快的账号。',
    sql: `${contentAnalysisCte}
select
  platform,
  coalesce(account_name, 'unknown') as account_name,
  count(*) as content_count,
  sum(coalesce(new_followers, 0)) as total_new_followers,
  avg(coalesce(follow_rate, 0)) as avg_follow_rate,
  avg(coalesce(content_score, 0)) as avg_content_score
from content_analysis
where publish_date >= current_date - interval '30 day'
group by platform, coalesce(account_name, 'unknown')
order by total_new_followers desc nulls last, avg_follow_rate desc nulls last
limit 12;
`.trim(),
  },
  platform_comparison: {
    summary: 'B 站与知乎内容表现对比。',
    sql: `${contentAnalysisCte}
select
  platform,
  count(*) as sample_count,
  avg(coalesce(views, 0)) as avg_views,
  avg(coalesce(likes, 0)) as avg_likes,
  avg(coalesce(new_followers, 0)) as avg_new_followers,
  avg(coalesce(content_score, 0)) as avg_content_score
from content_analysis
group by platform
order by avg_content_score desc nulls last;
`.trim(),
  },
  topic_average_performance: {
    summary: '按主题/标签聚合后的平均表现。',
    sql: `${contentAnalysisCte}
select
  topic_type,
  count(*) as sample_count,
  avg(coalesce(views, 0)) as avg_views,
  avg(coalesce(likes, 0)) as avg_likes,
  avg(coalesce(new_followers, 0)) as avg_new_followers,
  avg(coalesce(content_score, 0)) as avg_content_score
from content_analysis
where topic_type is not null
group by topic_type
order by avg_content_score desc nulls last, sample_count desc;
`.trim(),
  },
  anomalous_growth_content: {
    summary: '近期疑似异常增长内容。',
    sql: `${contentAnalysisCte}
select
  platform,
  title,
  coalesce(account_name, 'unknown') as account_name,
  publish_date,
  views,
  likes,
  new_followers,
  follow_rate,
  content_score
from content_analysis
where publish_date >= current_date - interval '30 day'
  and (
    coalesce(new_followers, 0) > 0
    or coalesce(follow_rate, 0) > 0
    or coalesce(content_score, 0) > 0
  )
order by coalesce(follow_rate, 0) desc nulls last, coalesce(content_score, 0) desc nulls last
limit 15;
`.trim(),
  },
};

export function pickSqlTemplate(question: string) {
  const normalized = question.toLowerCase();
  const platform = detectPlatform(question);
  const dayWindow = extractDayWindow(question);

  if (normalized.includes('增长最快') || normalized.includes('涨粉最快')) {
    return 'fastest_growing_accounts';
  }

  if (normalized.includes('差异') || normalized.includes('对比') || platform === 'cross_platform' && normalized.includes('平台')) {
    return 'platform_comparison';
  }

  if (normalized.includes('标签') || normalized.includes('平均表现') || normalized.includes('特征')) {
    return 'topic_average_performance';
  }

  if (normalized.includes('异常增长') || normalized.includes('异常')) {
    return 'anomalous_growth_content';
  }

  return dayWindow <= 7 ? 'top_content_last_7_days' : 'top_content_last_30_days';
}
