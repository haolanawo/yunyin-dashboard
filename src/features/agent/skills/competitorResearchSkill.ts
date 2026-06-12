import type { StrategySkill } from './types';
import { runSkillPipeline } from './shared';

export const competitorResearchSkill: StrategySkill = {
  name: 'competitor_research_skill',
  description: 'Compare accounts, platforms, and content matrices.',
  whenToUse: ['competitor', 'platform difference', 'matrix comparison'],
  requiredTools: ['queryDatabaseTool', 'runAnalyticsTool', 'generateStrategyReportTool'],
  run(context) {
    return runSkillPipeline({
      skillName: this.name,
      context,
      sqlInput: {
        template: 'platform_comparison',
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
