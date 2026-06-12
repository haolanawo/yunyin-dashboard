import type { StrategySkill } from './types';
import { runSkillPipeline } from './shared';

export const dataDiagnosisSkill: StrategySkill = {
  name: 'data_diagnosis_skill',
  description: 'Check data completeness, crawler issues, and metric anomalies.',
  whenToUse: ['missing data', 'crawler issue', 'metric anomaly'],
  requiredTools: ['queryDatabaseTool', 'runAnalyticsTool', 'generateStrategyReportTool'],
  run(context) {
    return runSkillPipeline({
      skillName: this.name,
      context,
      sqlInput: {
        template: 'anomalous_growth_content',
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
