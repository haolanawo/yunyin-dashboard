import type { StrategySkill } from './types';
import { runSkillPipeline } from './shared';

export const trendAnalysisSkill: StrategySkill = {
  name: 'trend_analysis_skill',
  description: 'Analyze recent performance, trend shifts, and abnormal growth.',
  whenToUse: ['recent performance', 'growth', 'trend', 'anomaly'],
  requiredTools: ['queryDatabaseTool', 'runAnalyticsTool', 'generateStrategyReportTool'],
  run(context) {
    const template = context.input.question.includes('7') ? 'top_content_last_7_days' : 'anomalous_growth_content';
    return runSkillPipeline({
      skillName: this.name,
      context,
      sqlInput: {
        template,
        question: context.input.question,
      },
      analyticsInput: {
        question: context.input.question,
        platform: 'cross_platform',
        mode: 'overview',
      },
    });
  },
};
