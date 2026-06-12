import type { StrategySkill } from './types';
import { runSkillPipeline } from './shared';

export const writingStrategySkill: StrategySkill = {
  name: 'writing_strategy_skill',
  description: 'Turn data and cases into editorial or writing guidance.',
  whenToUse: ['topic suggestion', 'title optimization', 'draft scoring'],
  requiredTools: ['queryDatabaseTool', 'runAnalyticsTool', 'generateStrategyReportTool'],
  run(context) {
    return runSkillPipeline({
      skillName: this.name,
      context,
      sqlInput: {
        template: 'topic_average_performance',
        question: context.input.question,
      },
      analyticsInput: {
        question: context.input.question,
        platform: 'zhihu',
        mode: 'semantic',
      },
    });
  },
};
