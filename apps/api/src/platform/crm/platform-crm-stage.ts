import { BadRequestException } from '@nestjs/common';
import { LeadStage } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  [LeadStage.NEW]: [LeadStage.QUALIFIED],
  [LeadStage.QUALIFIED]: [LeadStage.WON, LeadStage.LOST],
  [LeadStage.WON]: [],
  [LeadStage.LOST]: [],
};

export function assertLeadStageTransition(from: LeadStage, to: LeadStage): void {
  if (from === to) return;
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid stage transition from ${from} to ${to}. Allowed: ${allowed.join(', ') || 'none'}`,
    );
  }
}
