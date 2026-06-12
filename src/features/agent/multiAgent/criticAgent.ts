import type { MultiAgentStep } from '../types';

interface CriticAgentInput {
  rowCount: number;
  evidenceCount: number;
  report: string;
}

export async function runCriticAgent(input: CriticAgentInput): Promise<
  MultiAgentStep<{ warnings: string[]; summary: string; confidence: 'low' | 'medium' | 'high' }>
> {
  const warnings: string[] = [];

  if (input.rowCount === 0) {
    warnings.push('SQL 没有返回样本，回答必须明确标注“数据不足”。');
  } else if (input.rowCount < 5) {
    warnings.push('结构化样本少于 5 条，结论只能作为方向性判断。');
  } else if (input.rowCount < 15) {
    warnings.push('结构化样本不多，适合先做小流量验证，再扩大执行。');
  }

  if (input.evidenceCount === 0) {
    warnings.push('没有检索到历史报告或案例，历史上下文偏弱。');
  }

  if (!/风险|不确定性|uncertainty|risk/i.test(input.report)) {
    warnings.push('报告缺少明确的不确定性说明。');
  }

  const confidence =
    input.rowCount >= 15 && input.evidenceCount >= 3
      ? 'high'
      : input.rowCount >= 5 && input.evidenceCount >= 1
        ? 'medium'
        : 'low';

  return {
    agent: 'critic',
    output: {
      warnings,
      confidence,
      summary:
        warnings.length > 0
          ? `Critic 提醒：${warnings.join('；')}`
          : `Critic 审查通过，当前证据密度可支撑 ${confidence} 置信度结论。`,
    },
  };
}
