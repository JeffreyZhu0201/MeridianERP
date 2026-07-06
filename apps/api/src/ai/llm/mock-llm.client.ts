import { Injectable } from '@nestjs/common';
import type {
  DiagnosisCard,
  DiagnosisCardStatus,
  DiagnosisDomain,
  DiagnosisResult,
  Source,
} from '@meridian/shared';
import type { ToolResult } from '../diagnosis/tools/base.tool';

export interface ToolRunResult {
  domain: DiagnosisDomain;
  title: string;
  result: ToolResult;
}

function cardStatus(result: ToolResult): DiagnosisCardStatus {
  if (!result.found) {
    return result.summary.includes('未查询到') ? 'warning' : 'error';
  }
  if (result.summary.includes('需') || result.summary.includes('尚未')) {
    return 'warning';
  }
  return 'normal';
}

const DOMAIN_TITLES: Record<DiagnosisDomain, string> = {
  order: '订单',
  commission: '佣金',
  inventory: '库存',
  fund: '资金',
};

@Injectable()
export class MockLlmClient {
  synthesize(query: string, toolRuns: ToolRunResult[]): DiagnosisResult {
    const cards: DiagnosisCard[] = toolRuns.map((run) => ({
      domain: run.domain,
      title: run.title,
      status: cardStatus(run.result),
      value: run.result.summary,
      detail:
        run.result.data && typeof run.result.data === 'object'
          ? (run.result.data as Record<string, unknown>)
          : undefined,
    }));

    const sources: Source[] = toolRuns
      .filter((run) => run.result.found)
      .map((run) => ({
        domain: run.domain,
        ref: `${run.title}: ${run.result.summary.slice(0, 40)}`,
        description: DOMAIN_TITLES[run.domain],
      }));

    const findings = cards.map((c) => `【${c.title}】${c.value}`).join('\n');

    const commissionCard = cards.find((c) => c.domain === 'commission');
    const orderCard = cards.find((c) => c.domain === 'order');

    let conclusion = '综合上述域数据，当前业务状态已梳理完毕。';
    if (commissionCard?.status === 'error' || commissionCard?.status === 'warning') {
      conclusion =
        '拓店员佣金仅在分店配货单确认（CONFIRMED）时计提，且每家 recruited 分店前 2 笔配货可计佣；零售订单履约不产生佣金。';
      if (orderCard) {
        conclusion += ' 所查订单状态为相关因素之一，请结合配货与招募关系核对。';
      }
    }

    const report = [
      `诊断主题：${query.trim()}`,
      '',
      '【分析依据】',
      findings || '未命中可解析的业务标识，请提供订单 ID 或分店 slug。',
      '',
      '【结论】',
      conclusion,
    ].join('\n');

    return { report, cards, sources };
  }
}
