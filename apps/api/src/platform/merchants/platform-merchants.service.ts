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

/**
 * 平台商户服务 - 处理商户的审批、管理和经销商分配
 *
 * 商户入驻流程：
 * 1. SUBMITTED - 商户提交申请
 * 2. UNDER_REVIEW - 平台审核中
 * 3. APPROVED - 审核通过，开通商店
 * 4. REJECTED - 审核拒绝
 *
 * 商户与经销商关系：
 * - 商户可被平台级经销商招募
 * - 招募关系影响佣金计算
 */
@Injectable()
export class PlatformMerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  /**
   * 分页查询商户列表
   *
   * @param query - 查询参数（分页、状态、搜索）
   * @returns 分页结果
   */
  async list(query: ListMerchantsQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MerchantProfileWhereInput = {};
    if (query.status) {
      where.onboardingStatus = query.status;
    }
    // 按商户名称或联系邮箱搜索
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

  /**
   * 获取商户详情（含 CRM 汇总和经销商信息）
   *
   * @param id - 商户 Profile ID
   * @returns 商户详细信息
   */
  async getById(id: string): Promise<PlatformMerchantDetail> {
    const profile = await this.findProfileById(id);
    const [crmSummary, distributors] = await Promise.all([
      this.getCrmSummary(profile.tenantId),
      this.getDistributorSummaries(profile.tenantId),
    ]);
    return this.toPlatformMerchantDetail(profile, crmSummary, distributors);
  }

  /**
   * 审批商户
   *
   * 流程：
   * 1. 验证状态为 SUBMITTED 或 UNDER_REVIEW
   * 2. 处理招募关系（邀请码或手动指定）
   * 3. 生成商户 slug（避免重复）
   * 4. 事务中更新状态和租户 slug
   * 5. 发送欢迎邮件
   *
   * @param id - 商户 Profile ID
   * @param dto - 招募经销商 ID（可选）
   * @returns 更新后的商户资料
   */
  async approve(id: string, dto: { recruitedByDistributorId?: string } = {}) {
    const profile = await this.findProfileById(id);
    if (
      profile.onboardingStatus !== OnboardingStatus.SUBMITTED &&
      profile.onboardingStatus !== OnboardingStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Merchant cannot be approved in current status');
    }

    // 处理招募关系
    let recruitedByDistributorId = dto.recruitedByDistributorId ?? null;
    // 如果没有手动指定，尝试从邀请码获取
    if (!recruitedByDistributorId && profile.pendingRecruitInviteCode) {
      const invite = await this.prisma.merchantRecruitInviteCode.findFirst({
        where: {
          code: profile.pendingRecruitInviteCode,
          revokedAt: null,
        },
        include: { distributor: true },
      });
      // 只接受平台级活跃经销商的邀请
      if (invite?.distributor.tenantId === null && invite.distributor.isActive) {
        recruitedByDistributorId = invite.distributorId;
        // 更新邀请码使用次数
        await this.prisma.merchantRecruitInviteCode.update({
          where: { id: invite.id },
          data: { useCount: { increment: 1 } },
        });
      }
    }

    // 验证招募的经销商有效性
    if (recruitedByDistributorId) {
      const distributor = await this.prisma.distributor.findFirst({
        where: { id: recruitedByDistributorId, tenantId: null, isActive: true },
      });
      if (!distributor) {
        throw new BadRequestException('Invalid platform distributor for recruitment');
      }
    }

    // 生成商户 slug（唯一）
    const baseSlug = slugify(profile.businessName) || 'merchant';
    let slug = baseSlug;
    let suffix = 0;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    // 事务：更新状态 + 更新租户 slug
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

    // 发送欢迎邮件
    await this.emailQueue.sendMerchantWelcome(profile.contactEmail, profile.businessName);
    return updatedProfile;
  }

  /**
   * 拒绝商户申请
   *
   * @param id - 商户 Profile ID
   * @param dto - 拒绝原因
   * @returns 更新后的商户资料
   */
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
    // 发送拒绝邮件
    await this.emailQueue.sendMerchantRejected(profile.contactEmail, dto.reason);
    return updated;
  }

  /**
   * 更新商户的招募经销商
   *
   * 用于商户审核通过后的经销商变更
   * 记录变更日志以供审计
   *
   * @param id - 商户 Profile ID
   * @param dto - 新经销商 ID（可为 null 表示解除关系）
   * @param platformUserId - 平台操作人 ID
   * @returns 更新后的商户资料
   */
  async updateRecruiter(
    id: string,
    dto: { recruitedByDistributorId: string | null; reason: string },
    platformUserId: string,
  ) {
    const profile = await this.findProfileById(id);
    // 只有已审核通过的商户才能变更招募关系
    if (profile.onboardingStatus !== OnboardingStatus.APPROVED) {
      throw new BadRequestException('Only approved merchants can change recruiter');
    }
    if (!dto.reason?.trim()) {
      throw new BadRequestException('Reason is required');
    }

    // 验证新经销商有效性
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

    // 事务：更新招募关系 + 创建变更日志
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

  /**
   * 根据 ID 查询商户资料
   */
  private async findProfileById(id: string): Promise<MerchantProfile> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      throw new NotFoundException('Merchant not found');
    }
    return profile;
  }

  /**
   * 获取商户的 CRM 汇总（联系人、公司、线索数量）
   */
  private async getCrmSummary(tenantId: string): Promise<MerchantCrmSummary> {
    const [contacts, companies, leads] = await Promise.all([
      this.prisma.crmContact.count({ where: { tenantId } }),
      this.prisma.crmCompany.count({ where: { tenantId } }),
      this.prisma.crmLead.count({ where: { tenantId } }),
    ]);
    return { contacts, companies, leads };
  }

  /**
   * 获取商户的经销商汇总
   *
   * 包含：绑定数量、近30天绑定数、近30天归属订单数
   */
  private async getDistributorSummaries(
    tenantId: string,
  ): Promise<MerchantDistributorSummary[]> {
    const windowStart = dashboardWindowStart();

    const [distributorRows, bindingTotals, bindingRecent, orderRecent] =
      await Promise.all([
        // 查找所有绑定到该商户的经销商
        this.prisma.distributor.findMany({
          where: { tenantId },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, isActive: true },
        }),
        // 总绑定数
        this.prisma.binding.groupBy({
          by: ['distributorId'],
          where: { tenantId },
          _count: true,
        }),
        // 近30天绑定数
        this.prisma.binding.groupBy({
          by: ['distributorId'],
          where: { tenantId, boundAt: { gte: windowStart } },
          _count: true,
        }),
        // 近30天归属订单数
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

    // 构建映射
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

  /**
   * 转换为平台商户详情格式
   */
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
