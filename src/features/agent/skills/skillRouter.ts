import type { AgentIntent, StrategySkill } from '../types';
import { competitorResearchSkill } from './competitorResearchSkill';
import { dataDiagnosisSkill } from './dataDiagnosisSkill';
import { trendAnalysisSkill } from './trendAnalysisSkill';
import { viralContentAnalysisSkill } from './viralContentAnalysisSkill';
import { writingStrategySkill } from './writingStrategySkill';

const skillMap: Record<AgentIntent, StrategySkill> = {
  trend_analysis: trendAnalysisSkill,
  competitor_research: competitorResearchSkill,
  viral_content_analysis: viralContentAnalysisSkill,
  writing_strategy: writingStrategySkill,
  data_diagnosis: dataDiagnosisSkill,
  general_strategy: viralContentAnalysisSkill,
};

export function skillRouter(intent: AgentIntent) {
  return skillMap[intent];
}
