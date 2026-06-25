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
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DistributorMeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly withdrawalsService: PlatformWithdrawalsService,
  ) {}

  private distributorId(user: AuthenticatedUser) {
    return user.userId;
  }

  private async loadDistributor(user: AuthenticatedUser) {
    const distributor = await this.prisma.distributor.findFirst({
      where: {
        id: this.distributorId(user),
        portalEnabled: true,
        isActive: true,
        tenantId: null,
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
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
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
      tenantId: { in: tenantIds },
      status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },
      createdAt: boundAtFilter,
    };
    const ledgerWhere = {
      distributorId,
      createdAt: boundAtFilter,
      status: { not: LedgerStatus.VOID },
    };

    const [
      branchCount,
      orderAgg,
      commissionAccruedAgg,
      commissionSettledAgg,
      entryCount,
      trendOrders,
      availableBalance,
    ] = await Promise.all([
      this.prisma.merchantProfile.count({
        where: { recruitedByDistributorId: distributorId },
      }),
      tenantIds.length
        ? this.prisma.order.aggregate({
            where: orderWhere,
            _count: { _all: true },
            _sum: { total: true },
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
              createdAt: true,
              total: true,
              commissionEntry: { select: { amount: true, status: true } },
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
      distributorId: distributor.id,
      distributorName: distributor.name,
      branchCount,
      attributedOrderCount: orderAgg._count._all,
      attributedOrderRevenue: decimalSumToString(orderAgg._sum.total),
      availableBalance: availableBalance.toString(),
      commissionSummary: {
        accruedTotal,
        settledTotal,
        totalCommission,
        entryCount,
        from: range.fromIso,
        to: range.toIso,
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
        const agg = await this.prisma.order.aggregate({
          where: {
            tenantId: m.tenantId,
            status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },
            createdAt: { gte: windowStart },
          },
          _sum: { total: true },
          _count: { _all: true },
        });
        return {
          tenantId: m.tenantId,
          merchantProfileId: m.id,
          businessName: m.businessName,
          slug: m.tenant.slug,
          recruitedAt: m.recruitedAt?.toISOString() ?? null,
          salesLast30Days: Number(agg._sum.total ?? 0),
          orderCountLast30Days: agg._count._all,
        };
      }),
    );
  }

  async listWithdrawals(user: AuthenticatedUser) {
    const distributor = await this.loadDistributor(user);
    return this.prisma.withdrawalRequest.findMany({
      where: { distributorId: distributor.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWithdrawal(
    user: AuthenticatedUser,
    amount: number,
    note?: string,
  ) {
    const distributor = await this.loadDistributor(user);
    return this.withdrawalsService.createRequest(distributor.id, amount, note);
  }

  async listCommissions(user: AuthenticatedUser, query: CommissionListQueryDto) {
    const distributor = await this.loadDistributor(user);
    const range = parseDateRangeQuery(query);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.commissionLedger.count({ where }),
    ]);

    return {
      items: rows.map(mapCommissionStatementRow),
      total,
      page,
      limit,
    };
  }
}
