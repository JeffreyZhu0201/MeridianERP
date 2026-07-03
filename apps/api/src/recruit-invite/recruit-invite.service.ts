import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ValidatedRecruitInvite {
  code: string;
  distributorId: string;
  distributorName: string;
}

@Injectable()
export class RecruitInviteService {
  constructor(private readonly prisma: PrismaService) {}

  async validateMerchantRecruitCode(
    rawCode: string,
  ): Promise<ValidatedRecruitInvite> {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      throw new BadRequestException('Invalid invite code');
    }
    const invite = await this.prisma.merchantRecruitInviteCode.findFirst({
      where: { code, revokedAt: null },
      include: { distributor: true },
    });
    if (!invite) {
      throw new BadRequestException('Invalid invite code');
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite code has expired');
    }
    if (!invite.distributor.isActive || invite.distributor.tenantId !== null) {
      throw new BadRequestException('Invite code is not valid for branch registration');
    }
    return {
      code: invite.code,
      distributorId: invite.distributorId,
      distributorName: invite.distributor.name,
    };
  }

  async previewInviteCode(rawCode: string) {
    const validated = await this.validateMerchantRecruitCode(rawCode);
    return {
      code: validated.code,
      promoterName: validated.distributorName,
    };
  }
}
