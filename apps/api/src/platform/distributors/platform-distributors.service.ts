import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommissionType, LedgerStatus, OrderStatus, Prisma } from '@prisma/client';
import { sumAllocationLineCost } from '@meridian/shared';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAccountsService } from '../accounts/platform-accounts.service';
import { PlatformWithdrawalsService } from '../withdrawals/platform-withdrawals.service';
import { RecruitInviteCodesService } from '../../recruit-invite/recruit-invite-codes.service';

function displayNameFromAccount(account: {
  email: string;
  firstName: string | null;
  lastName: string | null;
}): string {
  const parts = [account.firstName, account.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return account.email.split('@')[0] ?? account.email;
}

@Injectable()
export class PlatformDistributorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformAccounts: PlatformAccountsService,
    private readonly inviteCodes: RecruitInviteCodesService,
    private readonly withdrawalsService: PlatformWithdrawalsService,
  ) {}

  async list() {
    const rows = await this.prisma.distributor.findMany({
      where: { tenantId: null },
      include: {
        _count: { select: { recruitedMerchants: true } },
        account: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      accountId: d.accountId,
      accountEmail: d.account?.email ?? null,
      commissionRate: Number(d.commissionRate),
      commissionType: d.commissionType,
      isActive: d.isActive,
      portalEnabled: d.portalEnabled,
      recruitedMerchantCount: d._count.recruitedMerchants,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  async create(dto: {
    name?: string;
    email?: string;
    phone?: string;
    accountId?: string;
    commissionRate: number;
    commissionType?: CommissionType;
  }) {
    let name = dto.name?.trim();
    let email = dto.email?.trim();
    let phone = dto.phone?.trim();
    let accountId: string | undefined;

    if (dto.accountId) {
      const account = await this.platformAccounts.findById(dto.accountId);
      if (!account) {
        throw new NotFoundException('Account not found');
      }
      const existing = await this.prisma.distributor.findUnique({
        where: { accountId: account.id },
      });
      if (existing) {
        throw new ConflictException('Account is already linked to a promoter');
      }
      accountId = account.id;
      name = name || displayNameFromAccount(account);
      email = email || account.email;
      phone = phone || account.phone || undefined;
    }

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    return this.prisma.distributor.create({
      data: {
        tenantId: null,
        accountId,
        name,
        email: email || null,
        phone: phone || null,
        commissionRate: dto.commissionRate,
        commissionType: dto.commissionType ?? CommissionType.PERCENT,
        isActive: true,
      },
    });
  }

  async update(
    id: string,
    dto: Partial<{
      name: string;
      email: string;
      phone: string;
      commissionRate: number;
      commissionType: CommissionType;
      isActive: boolean;
    }>,
  ) {
    await this.assertPlatformDistributor(id);
    return this.prisma.distributor.update({ where: { id }, data: dto });
  }

  async enablePortal(id: string, password: string) {
    const distributor = await this.assertPlatformDistributor(id);
    if (!distributor.email) {
      throw new BadRequestException('Distributor email is required for portal access');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.distributor.update({
      where: { id },
      data: { portalEnabled: true, passwordHash },
    });
  }

  async getById(id: string) {
    const d = await this.prisma.distributor.findFirst({
      where: { id, tenantId: null },
      include: { account: { select: { id: true, email: true } } },
    });
    if (!d) {
      throw new NotFoundException('Platform distributor not found');
    }
    const [recruitedCount, inviteCodes] = await Promise.all([
      this.prisma.merchantProfile.count({
        where: { recruitedByDistributorId: id },
      }),
      this.prisma.merchantRecruitInviteCode.findMany({
        where: { distributorId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    return {
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      accountId: d.accountId,
      accountEmail: d.account?.email ?? null,
      commissionRate: Number(d.commissionRate),
      commissionType: d.commissionType,
      isActive: d.isActive,
      portalEnabled: d.portalEnabled,
      recruitedMerchantCount: recruitedCount,
      createdAt: d.createdAt.toISOString(),
      inviteCodes: inviteCodes.map((inv) => this.inviteCodes.toInviteRow(inv)),
    };
  }

  async createInviteCode(distributorId: string, expiresInDays?: number) {
    await this.assertPlatformDistributor(distributorId);
    return this.inviteCodes.createInviteCode(distributorId, expiresInDays);
  }

  async revokeInviteCode(distributorId: string, codeId: string) {
    await this.assertPlatformDistributor(distributorId);
    return this.inviteCodes.revokeInviteCode(distributorId, codeId);
  }

  async getBranches(distributorId: string) {
    await this.assertPlatformDistributor(distributorId);
    const windowStart = new Date();
    windowStart.setUTCDate(windowStart.getUTCDate() - 30);

    const merchants = await this.prisma.merchantProfile.findMany({
      where: { recruitedByDistributorId: distributorId },
      include: { tenant: true },
    });

    const summaries = await Promise.all(
      merchants.map(async (m) => {
        const [recentAgg, lifetimeAgg] = await Promise.all([
          this.prisma.order.aggregate({
            where: {
              tenantId: m.tenantId,
              status: { in: ['PAID', 'FULFILLED'] },
              createdAt: { gte: windowStart },
            },
            _sum: { total: true },
            _count: { _all: true },
          }),
          this.prisma.order.aggregate({
            where: {
              tenantId: m.tenantId,
              status: { in: ['PAID', 'FULFILLED'] },
            },
            _sum: { total: true },
            _count: { _all: true },
          }),
        ]);
        return {
          tenantId: m.tenantId,
          merchantProfileId: m.id,
          businessName: m.businessName,
          slug: m.tenant.slug,
          recruitedAt: m.recruitedAt?.toISOString() ?? null,
          salesLast30Days: Number(recentAgg._sum.total ?? 0),
          orderCountLast30Days: recentAgg._count._all,
          lifetimeSales: Number(lifetimeAgg._sum.total ?? 0),
          lifetimeOrderCount: lifetimeAgg._count._all,
        };
      }),
    );
    return summaries;
  }

  async getFundsSummary(distributorId: string) {
    await this.assertPlatformDistributor(distributorId);
    const [accruedAgg, settledAgg, pendingAgg, available, branchCount] =
      await Promise.all([
        this.prisma.commissionLedger.aggregate({
          where: { distributorId, status: LedgerStatus.ACCRUED },
          _sum: { amount: true },
        }),
        this.prisma.commissionLedger.aggregate({
          where: { distributorId, status: LedgerStatus.SETTLED },
          _sum: { amount: true },
        }),
        this.prisma.withdrawalRequest.aggregate({
          where: { distributorId, status: 'PENDING' },
          _sum: { amount: true },
        }),
        this.withdrawalsService.getAvailableBalance(distributorId),
        this.prisma.merchantProfile.count({
          where: { recruitedByDistributorId: distributorId },
        }),
      ]);

    return {
      accruedTotal: accruedAgg._sum.amount?.toString() ?? '0',
      settledTotal: settledAgg._sum.amount?.toString() ?? '0',
      pendingWithdrawals: pendingAgg._sum.amount?.toString() ?? '0',
      availableBalance: available.toString(),
      branchCount,
    };
  }

  async getWithdrawals(distributorId: string) {
    await this.assertPlatformDistributor(distributorId);
    const distributor = await this.prisma.distributor.findUniqueOrThrow({
      where: { id: distributorId },
      select: { name: true, email: true },
    });
    const rows = await this.prisma.withdrawalRequest.findMany({
      where: { distributorId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      distributorId: row.distributorId,
      distributorName: distributor.name,
      distributorEmail: distributor.email,
      amount: row.amount.toString(),
      status: row.status,
      note: row.note,
      rejectionReason: row.rejectionReason,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getCommissionEntries(
    distributorId: string,
    query: { page?: number; limit?: number } = {},
  ) {
    await this.assertPlatformDistributor(distributorId);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionLedgerWhereInput = { distributorId };

    const [rows, total] = await Promise.all([
      this.prisma.commissionLedger.findMany({
        where,
        include: {
          order: {
            select: {
              total: true,
              pickupVerifiedAt: true,
              shippedAt: true,
              status: true,
            },
          },
          allocationOrder: {
            include: {
              lines: { select: { quantity: true, wholesalePrice: true } },
            },
          },
          tenant: {
            select: {
              merchantProfile: { select: { businessName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.commissionLedger.count({ where }),
    ]);

    return {
      items: rows.map((row) => {
        const orderTotal = row.order
          ? row.order.total.toString()
          : row.allocationOrder?.lines?.length
            ? sumAllocationLineCost(row.allocationOrder.lines).toFixed(2)
            : '0';
        const fulfilledAt = row.order
          ? row.order.pickupVerifiedAt?.toISOString() ??
            row.order.shippedAt?.toISOString() ??
            (row.order.status === OrderStatus.FULFILLED
              ? row.createdAt.toISOString()
              : null)
          : row.createdAt.toISOString();
        return {
          id: row.id,
          orderId: row.orderId,
          allocationOrderId: row.allocationOrderId,
          tenantId: row.tenantId,
          businessName: row.tenant.merchantProfile?.businessName ?? '—',
          customerOrderSequence: row.customerOrderSequence,
          merchantAllocationSequence: row.merchantAllocationSequence,
          commissionSource: row.commissionSource,
          orderTotal,
          amount: row.amount.toString(),
          status: row.status,
          fulfilledAt,
          createdAt: row.createdAt.toISOString(),
        };
      }),
      total,
      page,
      limit,
    };
  }

  private async assertPlatformDistributor(id: string) {
    const distributor = await this.prisma.distributor.findFirst({
      where: { id, tenantId: null },
    });
    if (!distributor) {
      throw new NotFoundException('Platform distributor not found');
    }
    return distributor;
  }
}
