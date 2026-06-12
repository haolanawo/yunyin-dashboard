import type { AgentIntent } from './types';

const intentRules: Array<{ intent: AgentIntent; keywords: string[] }> = [
  {
    intent: 'data_diagnosis',
    keywords: ['异常', '缺失', '不对', '诊断', '爬虫', '报错', '缺数据', '指标异常', '为什么没数据'],
  },
  {
    intent: 'competitor_research',
    keywords: ['竞品', '对比', '差异', '账号矩阵', '平台对比', 'b站和知乎', 'b站', '知乎'],
  },
  {
    intent: 'viral_content_analysis',
    keywords: ['爆款', '高播放', '涨粉', '什么特征', '共性', '标题', '封面', '标签', '高表现内容'],
  },
  {
    intent: 'writing_strategy',
    keywords: ['选题', '写作', '标题优化', '草稿', '评分', '改写', '怎么写', '内容策略'],
  },
  {
    intent: 'trend_analysis',
    keywords: ['最近', '近7天', '近30天', '趋势', '增长', '表现最好', '异常增长'],
  },
];

export function detectAgentIntent(question: string): AgentIntent {
  const normalized = question.toLowerCase();

  for (const rule of intentRules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      return rule.intent;
    }
  }

  return 'general_strategy';
}
