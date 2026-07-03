import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MerchantProfile, MerchantRole, OnboardingStatus, OrderStatus, Prisma } from '@prisma/client';
import type {
  MerchantCrmSummary,
  MerchantDistributorSummary,
  PlatformMerchantDetail,
} from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailQueueService } from '../../queue/email-queue.service';
import { slugify } from '../../common/utils/slug.util';
import { dashboardWindowStart } from '../../common/date-range';
import { PlatformAccountsService } from '../accounts/platform-accounts.service';
import { CreatePlatformMerchantDto } from './dto/create-platform-merchant.dto';
import { RejectMerchantDto } from './dto/reject-merchant.dto';
import { ListMerchantsQueryDto } from './dto/list-merchants-query.dto';

@Injectable()
export class PlatformMerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService,
    private readonly platformAccounts: PlatformAccountsService,
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
    const [crmSummary, distributors, pendingRecruiter, recruitedDistributor] =
      await Promise.all([
        this.getCrmSummary(profile.tenantId),
        this.getDistributorSummaries(profile.tenantId),
        profile.pendingRecruitInviteCode
          ? this.prisma.merchantRecruitInviteCode.findFirst({
              where: { code: profile.pendingRecruitInviteCode },
              include: { distributor: { select: { id: true, name: true } } },
            })
          : Promise.resolve(null),
        profile.recruitedByDistributorId
          ? this.prisma.distributor.findUnique({
              where: { id: profile.recruitedByDistributorId },
              select: { id: true, name: true },
            })
          : Promise.resolve(null),
      ]);
    return this.toPlatformMerchantDetail(
      profile,
      crmSummary,
      distributors,
      pendingRecruiter,
      recruitedDistributor,
    );
  }

  async create(dto: CreatePlatformMerchantDto) {
    const account = await this.platformAccounts.findById(dto.ownerAccountId);
    if (!account) {
      throw new NotFoundException('Owner account not found');
    }
    if (await this.platformAccounts.hasMerchantOwnerRole(account.id)) {
      throw new BadRequestException('Account is already a merchant owner');
    }

    if (dto.recruitedByDistributorId) {
      const distributor = await this.prisma.distributor.findFirst({
        where: {
          id: dto.recruitedByDistributorId,
          tenantId: null,
          isActive: true,
        },
      });
      if (!distributor) {
        throw new BadRequestException('Invalid platform distributor for recruitment');
      }
    }

    const autoApprove = dto.autoApprove !== false;
    const baseSlug = slugify(dto.slug ?? dto.businessName) || 'merchant';
    let slug = baseSlug;
    let suffix = 0;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const tenant = await this.prisma.tenant.create({ data: { slug } });
    const profile = await this.prisma.merchantProfile.create({
      data: {
        tenantId: tenant.id,
        businessName: dto.businessName,
        legalName: dto.legalName ?? null,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone ?? null,
        onboardingStatus: autoApprove
          ? OnboardingStatus.APPROVED
          : OnboardingStatus.DRAFT,
        reviewedAt: autoApprove ? new Date() : null,
        storePublished: autoApprove,
        recruitedByDistributorId: dto.recruitedByDistributorId ?? null,
        recruitedAt: dto.recruitedByDistributorId ? new Date() : null,
      },
    });

    await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        accountId: account.id,
        email: account.email,
        role: MerchantRole.MERCHANT_OWNER,
      },
    });

    await this.platformAccounts.ensureCustomer(account.id, tenant.id, {
      email: account.email,
    });

    if (autoApprove) {
      await this.emailQueue.sendMerchantWelcome(dto.contactEmail, dto.businessName);
    }

    return profile;
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
          storePublished: true, // 自动开通商店
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

  
  async updateRecruiter(
    id: string,
    dto: { recruitedByDistributorId: string | null; reason: string },
    platformUserId: string,
  ) {
    const profile = await this.findProfileById(id);
    if (profile.onboardingStatus !== OnboardingStatus.APPROVED) {
      throw new BadRequestException('Only approved merchants can change recruiter');
    }
    if (!dto.reason?.trim()) {
      throw new BadRequestException('Reason is required');
    }
    if (dto.recruitedByDistributorId) {
      const distributor = await this.prisma.distributor.findFirst({
        where: {
          id: dto.recruitedByDistributorId,
          tenantId: null, // 必须是平台级经销商
          isActive: true,
        },
      });
      if (!distributor) {
        throw new BadRequestException('Invalid platform distributor');
      }
    }

    const previous = profile.recruitedByDistributorId;
    const [updated] = await this.prisma.$transaction([
      this.prisma.merchantProfile.update({
        where: { id },
        data: {
          recruitedByDistributorId: dto.recruitedByDistributorId,
          recruitedAt: dto.recruitedByDistributorId ? new Date() : null,
        },
      }),
      this.prisma.recruiterChangeLog.create({
        data: {
          merchantProfileId: id,
          previousDistributorId: previous,
          newDistributorId: dto.recruitedByDistributorId,
          reason: dto.reason.trim(),
          changedByPlatformUserId: platformUserId,
        },
      }),
    ]);

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
    pendingRecruiter: {
      distributorId: string;
      distributor: { name: string };
    } | null = null,
    recruitedDistributor: { id: string; name: string } | null = null,
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
      pendingRecruitInviteCode: profile.pendingRecruitInviteCode,
      pendingRecruiterId: pendingRecruiter?.distributorId ?? null,
      pendingRecruiterName: pendingRecruiter?.distributor.name ?? null,
      recruitedByDistributorId: profile.recruitedByDistributorId,
      recruitedByDistributorName: recruitedDistributor?.name ?? null,
      crmSummary,
      distributors,
    };
  }
}
