import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MerchantProfile,
  MerchantRole,
  OnboardingStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import type {
  MerchantCrmSummary,
  PlatformMerchantDetail,
  PlatformMerchantStatistics,
} from '@meridian/shared';
import { dashboardWindowStart } from '../../common/date-range';
import { buildOrderTrend } from '../../common/dashboard-trend';
import { decimalSumToString } from '../../merchant/commissions/commission-mappers';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailQueueService } from '../../queue/email-queue.service';
import { slugify } from '../../common/utils/slug.util';
import { PlatformAccountsService } from '../accounts/platform-accounts.service';
import { CreatePlatformMerchantDto } from './dto/create-platform-merchant.dto';
import { ListMerchantsQueryDto } from './dto/list-merchants-query.dto';
import { RejectMerchantDto } from './dto/reject-merchant.dto';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { PluginService } from '../../plugins/plugin.service';

@Injectable()
export class PlatformMerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService,
    private readonly platformAccounts: PlatformAccountsService,
    private readonly pluginService: PluginService,
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
      data: items.map((profile) => ({
        id: profile.id,
        tenantId: profile.tenantId,
        businessName: profile.businessName,
        contactEmail: profile.contactEmail,
        onboardingStatus: profile.onboardingStatus,
        submittedAt: profile.submittedAt?.toISOString() ?? null,
        createdAt: profile.createdAt.toISOString(),
        slug: profile.tenant.slug,
        storePublished: profile.storePublished,
        isFlagship: profile.isFlagship,
      })),
      meta: { total, page, limit },
    };
  }

  async getById(id: string): Promise<PlatformMerchantDetail> {
    const profile = await this.findProfileById(id);
    const [
      crmSummary,
      pendingRecruiter,
      recruitedDistributor,
      ownerUser,
    ] = await Promise.all([
      this.getCrmSummary(profile.tenantId),
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
      this.prisma.user.findFirst({
        where: {
          tenantId: profile.tenantId,
          role: MerchantRole.MERCHANT_OWNER,
        },
        select: { accountId: true },
      }),
    ]);
    return this.toPlatformMerchantDetail(
      profile,
      crmSummary,
      pendingRecruiter,
      recruitedDistributor,
      ownerUser?.accountId ?? null,
    );
  }

  listPlugins(merchantProfileId: string) {
    return this.pluginService.listForPlatformMerchant(merchantProfileId);
  }

  async getMerchantStatistics(
    merchantId: string,
    days = 30,
  ): Promise<PlatformMerchantStatistics> {
    const profile = await this.findProfileById(merchantId);
    if (profile.onboardingStatus !== OnboardingStatus.APPROVED) {
      throw new BadRequestException(
        'Statistics only available for approved merchants',
      );
    }

    const tenantId = profile.tenantId;
    const windowStart = dashboardWindowStart(days);
    const windowEnd = new Date();
    const orderWhere = {
      tenantId,
      status: OrderStatus.PAID,
      createdAt: { gte: windowStart },
    };

    const [
      orderAgg,
      productCount,
      variantCount,
      trendOrders,
      recentOrders,
      inventoryStats,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: orderWhere,
        _count: { _all: true },
        _sum: { total: true },
      }),
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.productVariant.count({
        where: { product: { tenantId } },
      }),
      this.prisma.order.findMany({
        where: {
          ...orderWhere,
          createdAt: { gte: windowStart, lte: windowEnd },
        },
        select: { createdAt: true, total: true },
      }),
      this.prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      this.getTenantInventoryStats(tenantId),
    ]);

    return {
      ordersLast30Days: orderAgg._count._all,
      revenueLast30Days: decimalSumToString(orderAgg._sum.total),
      productCount,
      skuCount: inventoryStats.skuCount || variantCount,
      totalUnitsOnHand: inventoryStats.totalUnitsOnHand,
      lowStockCount: inventoryStats.lowStockCount,
      trend: buildOrderTrend(windowStart, windowEnd, trendOrders),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        total: order.total.toString(),
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
    };
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
        throw new BadRequestException(
          'Invalid platform distributor for recruitment',
        );
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
      await this.emailQueue.sendMerchantWelcome(
        dto.contactEmail,
        dto.businessName,
      );
      await this.pluginService.installDefaultPlugins(tenant.id);
    }

    return profile;
  }

  async approve(id: string, dto: { recruitedByDistributorId?: string } = {}) {
    const profile = await this.findProfileById(id);
    if (
      profile.onboardingStatus !== OnboardingStatus.SUBMITTED &&
      profile.onboardingStatus !== OnboardingStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Merchant cannot be approved in current status',
      );
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
      if (
        invite?.distributor.tenantId === null &&
        invite.distributor.isActive
      ) {
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
        throw new BadRequestException(
          'Invalid platform distributor for recruitment',
        );
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
    await this.emailQueue.sendMerchantWelcome(
      profile.contactEmail,
      profile.businessName,
    );
    await this.pluginService.installDefaultPlugins(profile.tenantId);
    return updatedProfile;
  }

  async reject(id: string, dto: RejectMerchantDto) {
    const profile = await this.findProfileById(id);
    if (
      profile.onboardingStatus !== OnboardingStatus.SUBMITTED &&
      profile.onboardingStatus !== OnboardingStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Merchant cannot be rejected in current status',
      );
    }
    const updated = await this.prisma.merchantProfile.update({
      where: { id },
      data: {
        onboardingStatus: OnboardingStatus.REJECTED,
        rejectionReason: dto.reason,
        reviewedAt: new Date(),
      },
    });
    await this.emailQueue.sendMerchantRejected(
      profile.contactEmail,
      dto.reason,
    );
    return updated;
  }

  async updateRecruiter(
    id: string,
    dto: { recruitedByDistributorId: string | null; reason: string },
    platformUserId: string,
  ) {
    const profile = await this.findProfileById(id);
    if (profile.onboardingStatus !== OnboardingStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved merchants can change recruiter',
      );
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
  private async getTenantInventoryStats(tenantId: string): Promise<{
    skuCount: number;
    totalUnitsOnHand: number;
    lowStockCount: number;
  }> {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { tenantId },
      include: {
        stockLevels: { select: { quantityOnHand: true, variantId: true } },
      },
    });

    const settings = await this.prisma.tenantInventorySettings.findUnique({
      where: { tenantId },
    });
    const defaultThreshold = settings?.defaultReorderThreshold ?? 5;
    const defaultWarehouse = warehouses.find((w) => w.isDefault);

    let lowStockCount = 0;
    if (defaultWarehouse) {
      const variants = await this.prisma.productVariant.findMany({
        where: { product: { tenantId } },
        select: { id: true, reorderThreshold: true },
      });
      const thresholdByVariant = new Map(
        variants.map((v) => [v.id, v.reorderThreshold ?? defaultThreshold]),
      );
      for (const sl of defaultWarehouse.stockLevels) {
        const threshold =
          thresholdByVariant.get(sl.variantId) ?? defaultThreshold;
        if (sl.quantityOnHand <= threshold) lowStockCount++;
      }
    }

    const skuIds = new Set<string>();
    let totalUnitsOnHand = 0;
    for (const warehouse of warehouses) {
      for (const sl of warehouse.stockLevels) {
        skuIds.add(sl.variantId);
        totalUnitsOnHand += sl.quantityOnHand;
      }
    }

    return {
      skuCount: skuIds.size,
      totalUnitsOnHand,
      lowStockCount,
    };
  }

  private async getCrmSummary(tenantId: string): Promise<MerchantCrmSummary> {
    const [contacts, companies, leads] = await Promise.all([
      this.prisma.crmContact.count({ where: { tenantId } }),
      this.prisma.crmCompany.count({ where: { tenantId } }),
      this.prisma.crmLead.count({ where: { tenantId } }),
    ]);
    return { contacts, companies, leads };
  }

  private toPlatformMerchantDetail(
    profile: MerchantProfile,
    crmSummary: MerchantCrmSummary,
    pendingRecruiter: {
      distributorId: string;
      distributor: { name: string };
    } | null = null,
    recruitedDistributor: { id: string; name: string } | null = null,
    ownerAccountId: string | null = null,
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
      ownerAccountId,
      pendingRecruitInviteCode: profile.pendingRecruitInviteCode,
      pendingRecruiterId: pendingRecruiter?.distributorId ?? null,
      pendingRecruiterName: pendingRecruiter?.distributor.name ?? null,
      recruitedByDistributorId: profile.recruitedByDistributorId,
      recruitedByDistributorName: recruitedDistributor?.name ?? null,
      storePublished: profile.storePublished,
      isFlagship: profile.isFlagship,
      crmSummary,
    };
  }

  async updateStoreSettings(id: string, dto: UpdateStoreSettingsDto) {
    const profile = await this.findProfileById(id);
    if (profile.onboardingStatus !== OnboardingStatus.APPROVED) {
      throw new BadRequestException(
        'Store settings can only be updated for approved merchants',
      );
    }

    const nextStorePublished =
      dto.storePublished !== undefined
        ? dto.storePublished
        : profile.storePublished;
    let nextIsFlagship =
      dto.isFlagship !== undefined ? dto.isFlagship : profile.isFlagship;

    if (nextIsFlagship && !nextStorePublished) {
      throw new BadRequestException('Flagship store must be published');
    }
    if (!nextStorePublished) {
      nextIsFlagship = false;
    }

    await this.prisma.$transaction(async (tx) => {
      if (nextIsFlagship) {
        await tx.merchantProfile.updateMany({
          where: {
            isFlagship: true,
            id: { not: profile.id },
          },
          data: { isFlagship: false },
        });
      }
      await tx.merchantProfile.update({
        where: { id: profile.id },
        data: {
          storePublished: nextStorePublished,
          isFlagship: nextIsFlagship,
        },
      });
    });

    return this.getById(id);
  }
}
