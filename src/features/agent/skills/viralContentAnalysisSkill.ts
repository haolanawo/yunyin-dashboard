import type { StrategySkill } from './types';
import { runSkillPipeline } from './shared';

export const viralContentAnalysisSkill: StrategySkill = {
  name: 'viral_content_analysis_skill',
  description: 'Explain high-performing content patterns across title, cover, topic, and growth.',
  whenToUse: ['viral', 'high play', 'high followers', 'pattern'],
  requiredTools: ['queryDatabaseTool', 'runAnalyticsTool', 'generateStrategyReportTool'],
  run(context) {
    return runSkillPipeline({
      skillName: this.name,
      context,
      sqlInput: {
        template: 'top_content_last_30_days',
        question: context.input.question,
      },
      analyticsInput: {
        question: context.input.question,
        platform: context.input.question.includes('知乎') ? 'zhihu' : 'cross_platform',
        mode: context.input.question.includes('知乎') ? 'zhihu_stats' : 'semantic',
      },
    });
  },
};
