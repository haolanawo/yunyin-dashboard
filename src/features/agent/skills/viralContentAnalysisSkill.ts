import type { StrategySkill } from './types';
import { runSkillPipeline } from './shared';
import { detectPlatform, extractDayWindow } from '../utils';

export const viralContentAnalysisSkill: StrategySkill = {
  name: 'viral_content_analysis_skill',
  description: 'Explain high-performing content patterns across title, cover, topic, and growth.',
  whenToUse: ['viral', 'high play', 'high followers', 'pattern'],
  requiredTools: ['queryDatabaseTool', 'runAnalyticsTool', 'generateStrategyReportTool'],
  run(context) {
    const platform = detectPlatform(context.input.question);
    const dayWindow = extractDayWindow(context.input.question);

    return runSkillPipeline({
      skillName: this.name,
      context,
      sqlInput: {
        template: dayWindow <= 7 ? 'top_content_last_7_days' : 'top_content_last_30_days',
        question: context.input.question,
      },
      analyticsInput: {
        question: context.input.question,
        platform,
        mode: platform === 'zhihu' ? 'zhihu_stats' : 'semantic',
      },
    });
  },
};
