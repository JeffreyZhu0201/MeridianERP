import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MerchantProfile, OnboardingStatus, OrderStatus, Prisma } from '@prisma/client';
import type {
  MerchantCrmSummary,
  MerchantDistributorSummary,
  PlatformMerchantDetail,
} from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailQueueService } from '../../queue/email-queue.service';
import { slugify } from '../../common/utils/slug.util';
import { dashboardWindowStart } from '../../common/date-range';
import { RejectMerchantDto } from './dto/reject-merchant.dto';
import { ListMerchantsQueryDto } from './dto/list-merchants-query.dto';

@Injectable()
export class PlatformMerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  async list(query: ListMerchantsQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MerchantProfileWhereInput = {};
    if (query.status) {
      where.onboardingStatus = query.status;
    }
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { businessName: { contains: term, mode: 'insensitive' } },
        { contactEmail: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.merchantProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { tenant: true },
      }),
      this.prisma.merchantProfile.count({ where }),
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

  async getById(id: string): Promise<PlatformMerchantDetail> {
    const profile = await this.findProfileById(id);
    const [crmSummary, distributors] = await Promise.all([
      this.getCrmSummary(profile.tenantId),
      this.getDistributorSummaries(profile.tenantId),
    ]);
    return this.toPlatformMerchantDetail(profile, crmSummary, distributors);
  }

  async approve(id: string, dto: { recruitedByDistributorId?: string } = {}) {
    const profile = await this.findProfileById(id);
    if (
      profile.onboardingStatus !== OnboardingStatus.SUBMITTED &&
      profile.onboardingStatus !== OnboardingStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Merchant cannot be approved in current status');
    }

    let recruitedByDistributorId = dto.recruitedByDistributorId ?? null;
    if (!recruitedByDistributorId && profile.pendingRecruitInviteCode) {
      const invite = await this.prisma.merchantRecruitInviteCode.findFirst({
        where: {
          code: profile.pendingRecruitInviteCode,
          revokedAt: null,
        },
        include: { distributor: true },
      });
      if (invite?.distributor.tenantId === null && invite.distributor.isActive) {
        recruitedByDistributorId = invite.distributorId;
        await this.prisma.merchantRecruitInviteCode.update({
          where: { id: invite.id },
          data: { useCount: { increment: 1 } },
        });
      }
    }

    if (recruitedByDistributorId) {
      const distributor = await this.prisma.distributor.findFirst({
        where: { id: recruitedByDistributorId, tenantId: null, isActive: true },
      });
      if (!distributor) {
        throw new BadRequestException('Invalid platform distributor for recruitment');
      }
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
          storePublished: true,
          recruitedByDistributorId,
          recruitedAt: recruitedByDistributorId ? new Date() : null,
          pendingRecruitInviteCode: null,
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
    const profile = await this.findProfileById(id);
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

  private async findProfileById(id: string): Promise<MerchantProfile> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      throw new NotFoundException('Merchant not found');
    }
    return profile;
  }

  private async getCrmSummary(tenantId: string): Promise<MerchantCrmSummary> {
    const [contacts, companies, leads] = await Promise.all([
      this.prisma.crmContact.count({ where: { tenantId } }),
      this.prisma.crmCompany.count({ where: { tenantId } }),
      this.prisma.crmLead.count({ where: { tenantId } }),
    ]);
    return { contacts, companies, leads };
  }

  private async getDistributorSummaries(
    tenantId: string,
  ): Promise<MerchantDistributorSummary[]> {
    const windowStart = dashboardWindowStart();

    const [distributorRows, bindingTotals, bindingRecent, orderRecent] =
      await Promise.all([
        this.prisma.distributor.findMany({
          where: { tenantId },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, isActive: true },
        }),
        this.prisma.binding.groupBy({
          by: ['distributorId'],
          where: { tenantId },
          _count: true,
        }),
        this.prisma.binding.groupBy({
          by: ['distributorId'],
          where: { tenantId, boundAt: { gte: windowStart } },
          _count: true,
        }),
        this.prisma.order.groupBy({
          by: ['distributorId'],
          where: {
            tenantId,
            status: OrderStatus.PAID,
            createdAt: { gte: windowStart },
          },
          _count: true,
        }),
      ]);

    const totalByDistributor = new Map(
      bindingTotals.map((row) => [row.distributorId, row._count]),
    );
    const recentBindingsByDistributor = new Map(
      bindingRecent.map((row) => [row.distributorId, row._count]),
    );
    const recentOrdersByDistributor = new Map(
      orderRecent
        .filter((row) => row.distributorId != null)
        .map((row) => [row.distributorId!, row._count]),
    );

    return distributorRows.map((distributor) => ({
      id: distributor.id,
      name: distributor.name,
      isActive: distributor.isActive,
      bindingCount: totalByDistributor.get(distributor.id) ?? 0,
      bindingsLast30Days: recentBindingsByDistributor.get(distributor.id) ?? 0,
      attributedOrdersLast30Days:
        recentOrdersByDistributor.get(distributor.id) ?? 0,
    }));
  }

  private toPlatformMerchantDetail(
    profile: MerchantProfile,
    crmSummary: MerchantCrmSummary,
    distributors: MerchantDistributorSummary[],
  ): PlatformMerchantDetail {
    return {
      id: profile.id,
      businessName: profile.businessName,
      legalName: profile.legalName,
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone,
      onboardingStatus: profile.onboardingStatus,
      rejectionReason: profile.rejectionReason,
      submittedAt: profile.submittedAt?.toISOString() ?? null,
      reviewedAt: profile.reviewedAt?.toISOString() ?? null,
      tenantId: profile.tenantId,
      crmSummary,
      distributors,
    };
  }
}
