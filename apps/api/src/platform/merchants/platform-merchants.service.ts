import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailQueueService } from '../../queue/email-queue.service';
import { slugify } from '../../common/utils/slug.util';
import { RejectMerchantDto } from './dto/reject-merchant.dto';

@Injectable()
export class PlatformMerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.merchantProfile.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { tenant: true },
      }),
      this.prisma.merchantProfile.count(),
    ]);
    return {
      data: items,
      meta: { total, page, limit },
      items,
      total,
      page,
      limit,
    };
  }

  async getById(id: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id },
      include: {
        tenant: { include: { users: { select: { id: true, email: true, role: true } } } },
      },
    });
    if (!profile) {
      throw new NotFoundException('Merchant not found');
    }
    return profile;
  }

  async approve(id: string) {
    const profile = await this.getById(id);
    if (
      profile.onboardingStatus !== OnboardingStatus.SUBMITTED &&
      profile.onboardingStatus !== OnboardingStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Merchant cannot be approved in current status');
    }
    const baseSlug = slugify(profile.businessName) || 'merchant';
    let slug = baseSlug;
    let suffix = 0;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    const [updatedProfile] = await this.prisma.$transaction([
      this.prisma.merchantProfile.update({
        where: { id },
        data: {
          onboardingStatus: OnboardingStatus.APPROVED,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      }),
      this.prisma.tenant.update({
        where: { id: profile.tenantId },
        data: { slug },
      }),
    ]);
    await this.emailQueue.sendMerchantWelcome(profile.contactEmail, profile.businessName);
    return updatedProfile;
  }

  async reject(id: string, dto: RejectMerchantDto) {
    const profile = await this.getById(id);
    if (
      profile.onboardingStatus !== OnboardingStatus.SUBMITTED &&
      profile.onboardingStatus !== OnboardingStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Merchant cannot be rejected in current status');
    }
    const updated = await this.prisma.merchantProfile.update({
      where: { id },
      data: {
        onboardingStatus: OnboardingStatus.REJECTED,
        rejectionReason: dto.reason,
        reviewedAt: new Date(),
      },
    });
    await this.emailQueue.sendMerchantRejected(profile.contactEmail, dto.reason);
    return updated;
  }
}
