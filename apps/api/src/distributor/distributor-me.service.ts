import { Injectable, NotFoundException } from '@nestjs/common';
import { LedgerStatus, OrderStatus, Prisma } from '@prisma/client';
import { DEFAULT_COMMISSION_WINDOW_DAYS } from '@meridian/shared';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { parseDateRangeQuery } from '../common/date-range';
import { buildOrderTrend } from '../common/dashboard-trend';
import {
  decimalSumToString,
  mapCommissionStatementRow,
} from '../merchant/commissions/commission-mappers';
import { CommissionListQueryDto } from '../merchant/commissions/dto/commission-list-query.dto';
import { PlatformWithdrawalsService } from '../platform/withdrawals/platform-withdrawals.service';
import { RecruitInviteCodesService } from '../recruit-invite/recruit-invite-codes.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DistributorMeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly withdrawalsService: PlatformWithdrawalsService,
    private readonly inviteCodes: RecruitInviteCodesService,
  ) {}

  private distributorId(user: AuthenticatedUser) {
    return user.userId;
  }

  private async loadDistributor(user: AuthenticatedUser) {
    const distributor = await this.prisma.distributor.findFirst({
      where: {
        id: this.distributorId(user), // 用户ID必须匹配
        portalEnabled: true, // 门户访问必须已启用
        isActive: true, // 账户必须处于激活状态
        tenantId: null, // 必须是平台级经销商（tenantId为null）
      },
    });
    if (!distributor) {
      throw new NotFoundException('Distributor not found');
    }
    return distributor;
  }

  private defaultRangeQuery() {
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - (DEFAULT_COMMISSION_WINDOW_DAYS - 1));
    from.setUTCHours(0, 0, 0, 0);
    to.setUTCHours(23, 59, 59, 999);
    return parseDateRangeQuery({
      from: from.toISOString().slice(0, 10), // 格式：YYYY-MM-DD
      to: to.toISOString().slice(0, 10), // 格式：YYYY-MM-DD
    });
  }

  async getDashboard(user: AuthenticatedUser) {
    const distributor = await this.loadDistributor(user);
    const range = this.defaultRangeQuery();
    const distributorId = distributor.id;
    const boundAtFilter = { gte: range.from, lte: range.to };
    const recruitedTenants = await this.prisma.merchantProfile.findMany({
      where: { recruitedByDistributorId: distributorId },
      select: { tenantId: true },
    });
    const tenantIds = recruitedTenants.map((m) => m.tenantId);
    const orderWhere = {
      tenantId: { in: tenantIds }, // 必须在招募的分店中
      status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] }, // 订单状态过滤
      createdAt: boundAtFilter, // 日期范围过滤
    };
    const ledgerWhere = {
      distributorId, // 必须是当前经销商的记录
      createdAt: boundAtFilter, // 日期范围过滤
      status: { not: LedgerStatus.VOID }, // 排除已作废的记录
    };
    const [
      branchCount, // 分店数量（该经销商招募的分店总数）
      orderAgg, // 订单聚合（数量和总额）
      commissionAccruedAgg, // 应计佣金聚合（ACCRUED 状态的佣金总额）
      commissionSettledAgg, // 已结算佣金聚合（SETTLED 状态的佣金总额）
      entryCount, // 佣金条目数量（所有非作废的佣金记录数）
      trendOrders, // 用于趋势计算的订单列表
      availableBalance, // 可用余额（可提现金额）
    ] = await Promise.all([
      this.prisma.merchantProfile.count({
        where: { recruitedByDistributorId: distributorId },
      }),
      tenantIds.length
        ? this.prisma.order.aggregate({
            where: orderWhere,
            _count: { _all: true }, // 统计订单总数量
            _sum: { total: true }, // 汇总订单总额
          })
        : Promise.resolve({ _count: { _all: 0 }, _sum: { total: null } }),
      this.prisma.commissionLedger.aggregate({
        where: { ...ledgerWhere, status: LedgerStatus.ACCRUED },
        _sum: { amount: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: { ...ledgerWhere, status: LedgerStatus.SETTLED },
        _sum: { amount: true },
      }),
      this.prisma.commissionLedger.count({ where: ledgerWhere }),
      tenantIds.length
        ? this.prisma.order.findMany({
            where: orderWhere,
            select: {
              createdAt: true, // 订单创建时间
              total: true, // 订单总金额
            },
          })
        : Promise.resolve([]),
      this.withdrawalsService.getAvailableBalance(distributorId),
    ]);
    const accruedTotal = decimalSumToString(commissionAccruedAgg._sum.amount);
    const settledTotal = decimalSumToString(commissionSettledAgg._sum.amount);
    const totalCommission = new Prisma.Decimal(accruedTotal)
      .plus(settledTotal)
      .toString();

    return {
      distributorId: distributor.id, // 经销商ID
      distributorName: distributor.name, // 经销商名称
      branchCount, // 分店数量
      attributedOrderCount: orderAgg._count._all, // 归因订单数量（指定日期范围内的已支付/已完成订单）
      attributedOrderRevenue: decimalSumToString(orderAgg._sum.total), // 归因订单营收
      availableBalance: availableBalance.toString(), // 可用余额
      commissionSummary: {
        accruedTotal, // 应计佣金总额（已产生但尚未结算的佣金）
        settledTotal, // 已结算佣金总额（已支付给经销商的佣金）
        totalCommission, // 佣金总额 = 应计 + 已结算
        entryCount, // 佣金条目数量
        from: range.fromIso, // 统计起始日期
        to: range.toIso, // 统计结束日期
      },
      trend: buildOrderTrend(range.from, range.to, trendOrders),
    };
  }

  async listBranches(user: AuthenticatedUser) {
    const distributor = await this.loadDistributor(user);
    const windowStart = new Date();
    windowStart.setUTCDate(windowStart.getUTCDate() - 30);
    const merchants = await this.prisma.merchantProfile.findMany({
      where: { recruitedByDistributorId: distributor.id },
      include: { tenant: true },
    });
    return Promise.all(
      merchants.map(async (m) => {
        const [recentAgg, lifetimeAgg] = await Promise.all([
          this.prisma.order.aggregate({
            where: {
              tenantId: m.tenantId,
              status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },
              createdAt: { gte: windowStart },
            },
            _sum: { total: true },
            _count: { _all: true },
          }),
          this.prisma.order.aggregate({
            where: {
              tenantId: m.tenantId,
              status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },
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
  }

  async listInviteCodes(user: AuthenticatedUser) {
    const distributor = await this.loadDistributor(user);
    return this.inviteCodes.listInviteCodes(distributor.id);
  }

  async createInviteCode(user: AuthenticatedUser, expiresInDays?: number) {
    const distributor = await this.loadDistributor(user);
    return this.inviteCodes.createInviteCode(distributor.id, expiresInDays);
  }

  async revokeInviteCode(user: AuthenticatedUser, codeId: string) {
    const distributor = await this.loadDistributor(user);
    return this.inviteCodes.revokeInviteCode(distributor.id, codeId);
  }

  async listWithdrawals(user: AuthenticatedUser) {
    const distributor = await this.loadDistributor(user);
    const rows = await this.prisma.withdrawalRequest.findMany({
      where: { distributorId: distributor.id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      distributorId: row.distributorId,
      distributorName: distributor.name,
      amount: row.amount.toString(),
      status: row.status,
      note: row.note,
      rejectionReason: row.rejectionReason,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      payoutProvider: row.payoutProvider,
      payoutReference: row.payoutReference,
      disbursedAt: row.disbursedAt?.toISOString() ?? null,
      payoutError: row.payoutError,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createWithdrawal(
    user: AuthenticatedUser,
    amount: number,
    note?: string,
  ) {
    const distributor = await this.loadDistributor(user);
    return this.withdrawalsService.createRequest(distributor.id, amount, note);
  }

  async listCommissions(
    user: AuthenticatedUser,
    query: CommissionListQueryDto,
  ) {
    const distributor = await this.loadDistributor(user);
    const range = parseDateRangeQuery(query);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit; // 计算分页偏移量
    const statusFilter = query.status
      ? { status: query.status }
      : { status: { not: LedgerStatus.VOID } };
    const where: Prisma.CommissionLedgerWhereInput = {
      distributorId: distributor.id,
      createdAt: { gte: range.from, lte: range.to },
      ...statusFilter,
    };
    const [rows, total] = await Promise.all([
      this.prisma.commissionLedger.findMany({
        where,
        include: {
          order: { select: { total: true } },
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
          distributor: {
            select: {
              id: true,
              name: true,
              commissionType: true,
              commissionRate: true,
            },
          },
          settlementBatch: true,
        },
        orderBy: { createdAt: 'desc' }, // 按创建时间倒序
        skip, // 跳过前 N 条（分页偏移量）
        take: limit, // 返回最多 N 条记录
      }),
      this.prisma.commissionLedger.count({ where }),
    ]);

    return {
      items: rows.map(mapCommissionStatementRow), // 映射后的佣金记录列表
      total, // 总记录数
      page, // 当前页码
      limit, // 每页条数
    };
  }
}
