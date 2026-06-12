import type { StrategySkill } from './types';
import { runSkillPipeline } from './shared';
import { detectPlatform, extractDayWindow } from '../utils';

export const trendAnalysisSkill: StrategySkill = {
  name: 'trend_analysis_skill',
  description: 'Analyze recent performance, trend shifts, and abnormal growth.',
  whenToUse: ['recent performance', 'growth', 'trend', 'anomaly'],
  requiredTools: ['queryDatabaseTool', 'runAnalyticsTool', 'generateStrategyReportTool'],
  run(context) {
    const dayWindow = extractDayWindow(context.input.question);
    const template = context.input.question.includes('异常') ? 'anomalous_growth_content' : dayWindow <= 7 ? 'top_content_last_7_days' : 'top_content_last_30_days';
    const platform = detectPlatform(context.input.question);

    return runSkillPipeline({
      skillName: this.name,
      context,
      sqlInput: {
        template,
        question: context.input.question,
      },
      analyticsInput: {
        question: context.input.question,
        platform,
        mode: platform === 'zhihu' ? 'zhihu_stats' : 'overview',
      },
    });
  },
};
