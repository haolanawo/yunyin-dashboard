interface SqlTemplateDefinition {
  sql: string;
  summary: string;
}

export const sqlTemplates: Record<string, SqlTemplateDefinition> = {
  top_content_last_30_days: {
    summary: 'Top-performing content from the last 30 days.',
    sql: `
select
  platform,
  title,
  account_name,
  publish_date,
  views,
  likes,
  new_followers,
  topic_type,
  content_score
from v_content_analysis
where publish_date >= current_date - interval '30 day'
order by content_score desc nulls last, views desc nulls last
limit 15;
`.trim(),
  },
  top_content_last_7_days: {
    summary: 'Top-performing content from the last 7 days.',
    sql: `
select
  platform,
  title,
  account_name,
  publish_date,
  views,
  likes,
  new_followers,
  topic_type,
  content_score
from v_content_analysis
where publish_date >= current_date - interval '7 day'
order by content_score desc nulls last, views desc nulls last
limit 15;
`.trim(),
  },
  fastest_growing_accounts: {
    summary: 'Accounts with the strongest follower growth in the last 30 days.',
    sql: `
select
  platform,
  account_name,
  count(*) as content_count,
  sum(coalesce(new_followers, 0)) as total_new_followers,
  avg(coalesce(follow_rate, 0)) as avg_follow_rate,
  avg(coalesce(content_score, 0)) as avg_content_score
from v_content_analysis
where publish_date >= current_date - interval '30 day'
group by platform, account_name
order by total_new_followers desc nulls last, avg_follow_rate desc nulls last
limit 12;
`.trim(),
  },
  platform_comparison: {
    summary: 'Cross-platform performance comparison between Bilibili and Zhihu.',
    sql: `
select
  platform,
  count(*) as sample_count,
  avg(coalesce(views, 0)) as avg_views,
  avg(coalesce(likes, 0)) as avg_likes,
  avg(coalesce(new_followers, 0)) as avg_new_followers,
  avg(coalesce(content_score, 0)) as avg_content_score
from v_content_analysis
group by platform
order by avg_content_score desc nulls last;
`.trim(),
  },
  topic_average_performance: {
    summary: 'Average content performance grouped by topic type.',
    sql: `
select
  topic_type,
  count(*) as sample_count,
  avg(coalesce(views, 0)) as avg_views,
  avg(coalesce(likes, 0)) as avg_likes,
  avg(coalesce(new_followers, 0)) as avg_new_followers,
  avg(coalesce(content_score, 0)) as avg_content_score
from v_content_analysis
where topic_type is not null
group by topic_type
order by avg_content_score desc nulls last, sample_count desc;
`.trim(),
  },
  anomalous_growth_content: {
    summary: 'Recently published content with unusually strong follower or score spikes.',
    sql: `
select
  platform,
  title,
  account_name,
  publish_date,
  views,
  likes,
  new_followers,
  follow_rate,
  content_score
from v_content_analysis
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

  if (normalized.includes('7')) {
    return 'top_content_last_7_days';
  }

  if (normalized.includes('增长最快') || normalized.includes('涨粉')) {
    return 'fastest_growing_accounts';
  }

  if (normalized.includes('差异') || (normalized.includes('b站') && normalized.includes('知乎'))) {
    return 'platform_comparison';
  }

  if (normalized.includes('标签') || normalized.includes('平均表现') || normalized.includes('特征')) {
    return 'topic_average_performance';
  }

  if (normalized.includes('异常增长') || normalized.includes('异常')) {
    return 'anomalous_growth_content';
  }

  return 'top_content_last_30_days';
}
