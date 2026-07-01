import { BadRequestException } from '@nestjs/common';
import { LeadStage } from '@prisma/client';

/**
 * 线索阶段流转规则定义
 *
 * 允许的流转方向：
 * - NEW → QUALIFIED
 * - QUALIFIED → WON / LOST
 * - WON/LOST 为终态，无法再流转
 */
const ALLOWED_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  [LeadStage.NEW]: [LeadStage.QUALIFIED],
  [LeadStage.QUALIFIED]: [LeadStage.WON, LeadStage.LOST],
  [LeadStage.WON]: [],
  [LeadStage.LOST]: [],
};

/**
 * 校验线索阶段流转是否合法
 *
 * @param from - 当前阶段
 * @param to - 目标阶段
 * @throws BadRequestException - 流转不合法时抛出
 */
export function assertLeadStageTransition(from: LeadStage, to: LeadStage): void {
  if (from === to) return;
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid stage transition from ${from} to ${to}. Allowed: ${allowed.join(', ') || 'none'}`,
    );
  }
}
