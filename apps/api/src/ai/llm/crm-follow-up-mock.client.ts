import { Injectable } from '@nestjs/common';
import type { CrmFollowUpSuggestion } from '@meridian/shared';
import { LeadStage } from '@prisma/client';
import type { CrmFollowUpContext } from './crm-follow-up.types';

@Injectable()
export class CrmFollowUpMockClient {
  suggest(context: CrmFollowUpContext): CrmFollowUpSuggestion {
    const lead = context.lead ?? context.relatedLeads?.[0];
    const stage = lead?.stage ?? LeadStage.NEW;
    const activityCount = context.activities.length;
    const days = context.daysSinceLastActivity;

    const sources: CrmFollowUpSuggestion['sources'] = [];
    if (lead) {
      sources.push({ type: 'lead', ref: `${lead.title} (${lead.stage})` });
    }
    if (context.contact) {
      sources.push({
        type: 'contact',
        ref: `${context.contact.firstName} ${context.contact.lastName}`,
      });
    }
    sources.push({ type: 'activities', ref: `${activityCount} 条近期活动` });

    const risks: string[] = [];
    if (days !== null && days >= 7) {
      risks.push(`已 ${days} 天无跟进活动，存在流失风险`);
    }
    if (activityCount === 0) {
      risks.push('尚无活动记录，建议尽快建立首次触达');
    }

    let summary = '';
    let stageInsight = '';
    let nextSteps: string[] = [];
    let talkingPoints: string[] = [];

    switch (stage) {
      case LeadStage.NEW:
        summary = `线索「${lead?.title ?? '未知'}」处于新建阶段，共有 ${activityCount} 条活动记录。`;
        stageInsight =
          '建议通过首次电话或会议确认需求，将阶段推进至「已确认（QUALIFIED）」。';
        nextSteps = [
          '核对联系人信息与来源渠道是否完整',
          '安排 15 分钟内首次电话或微信触达',
          '记录本次沟通要点到 CRM 活动',
        ];
        talkingPoints = [
          '了解客户当前采购场景与决策人',
          '确认预算区间与期望交付时间',
          '说明分店可提供的产品与服务范围',
        ];
        break;
      case LeadStage.QUALIFIED:
        summary = `线索已确认需求，需推动方案演示或报价以争取成交。`;
        stageInsight = '重点推进演示/样品/报价，向 WON 或 LOST 明确结论。';
        nextSteps = [
          '准备针对该线索的产品组合与价格方案',
          '预约现场或线上演示',
          '设定下一步时间节点并写入活动',
        ];
        talkingPoints = [
          '回顾上次沟通中客户的核心诉求',
          '展示与需求匹配的热销 SKU',
          '明确报价有效期与付款方式',
        ];
        break;
      case LeadStage.WON:
        summary = `线索已成交，建议转向交付协同与复购维护。`;
        stageInsight = '保持关系维护，关注复购与转介绍机会。';
        nextSteps = [
          '确认订单履约与收货满意度',
          '30 天内做一次回访',
          '收集可案例化反馈用于后续线索',
        ];
        talkingPoints = [
          '询问使用体验与补货计划',
          '介绍新品或促销（如适用）',
          '邀请满意客户转介绍',
        ];
        break;
      case LeadStage.LOST:
        summary = `线索已标记流失，可复盘原因并决定是否归档。`;
        stageInsight = '记录流失原因，避免重复无效投入。';
        nextSteps = [
          '补充一条 NOTE 活动记录流失原因',
          '评估 90 天后是否值得再次激活',
          '将联系人保留用于其他产品线触达',
        ];
        talkingPoints = [
          '礼貌确认未来是否有重新合作可能',
          '了解竞品或价格方面的主要障碍',
        ];
        break;
      default:
        summary = '请结合线索阶段与活动记录制定跟进计划。';
        nextSteps = ['查看最近活动并安排下一次触达'];
        talkingPoints = ['保持专业、简洁的沟通'];
    }

    if (context.subjectType === 'contact' && !lead) {
      summary = `联系人 ${context.contact?.firstName ?? ''} ${context.contact?.lastName ?? ''} 暂无关联线索，建议创建线索或记录首次活动。`;
      nextSteps = [
        '为联系人创建新线索并标注来源',
        '记录首次 CALL 或 NOTE 活动',
        '关联所属公司（如有）',
      ];
    }

    return {
      summary,
      nextSteps,
      talkingPoints,
      stageInsight,
      risks: risks.length > 0 ? risks : undefined,
      sources,
    };
  }
}
