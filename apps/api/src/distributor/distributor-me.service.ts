import { Injectable, NotFoundException } from '@nestjs/common';
import { BindType, LedgerStatus, OrderStatus, Prisma } from '@prisma/client';
import { DEFAULT_COMMISSION_WINDOW_DAYS } from '@meridian/shared';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { parseDateRangeQuery } from '../common/date-range';
import {
  decimalSumToString,
  mapCommissionStatementRow,
} from '../merchant/commissions/commission-mappers';
import { CommissionListQueryDto } from '../merchant/commissions/dto/commission-list-query.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DistributorMeService {
  constructor(private readonly prisma: PrismaService) {}

  private distributorId(user: AuthenticatedUser) {
    return user.userId;
  }

  private async loadDistributor(user: AuthenticatedUser) {
    const distributor = await this.prisma.distributor.findFirst({
      where: {
        id: this.distributorId(user),
        tenantId: user.tenantId!,
        portalEnabled: true,
        isActive: true,
      },
      include: { tenant: true },
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
    const tenantId = user.tenantId!;
    const boundAtFilter = { gte: range.from, lte: range.to };
    const orderWhere = {
      tenantId,
      distributorId,
      status: OrderStatus.PAID,
      createdAt: boundAtFilter,
    };
    const ledgerWhere = {
      tenantId,
      distributorId,
      createdAt: boundAtFilter,
      status: { not: LedgerStatus.VOID },
    };

    const [
      bindingsMerchant,
      bindingsCustomer,
      orderAgg,
      commissionAccruedAgg,
      commissionSettledAgg,
      entryCount,
    ] = await Promise.all([
      this.prisma.binding.count({
        where: {
          tenantId,
          distributorId,
          bindableType: BindType.MERCHANT,
          boundAt: boundAtFilter,
        },
      }),
      this.prisma.binding.count({
        where: {
          tenantId,
          distributorId,
          bindableType: BindType.CUSTOMER,
          boundAt: boundAtFilter,
        },
      }),
      this.prisma.order.aggregate({
        where: orderWhere,
        _count: { _all: true },
        _sum: { total: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: { ...ledgerWhere, status: LedgerStatus.ACCRUED },
        _sum: { amount: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: { ...ledgerWhere, status: LedgerStatus.SETTLED },
        _sum: { amount: true },
      }),
      this.prisma.commissionLedger.count({ where: ledgerWhere }),
    ]);

    const accruedTotal = decimalSumToString(commissionAccruedAgg._sum.amount);
    const settledTotal = decimalSumToString(commissionSettledAgg._sum.amount);
    const totalCommission = new Prisma.Decimal(accruedTotal)
      .plus(settledTotal)
      .toString();

    return {
      distributorId: distributor.id,
      distributorName: distributor.name,
      tenantSlug: distributor.tenant.slug,
      bindingsCount: bindingsMerchant + bindingsCustomer,
      bindingsMerchant,
      bindingsCustomer,
      attributedOrderCount: orderAgg._count._all,
      attributedOrderRevenue: decimalSumToString(orderAgg._sum.total),
      commissionSummary: {
        accruedTotal,
        settledTotal,
        totalCommission,
        entryCount,
        from: range.fromIso,
        to: range.toIso,
      },
    };
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
      tenantId: user.tenantId!,
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

  async listBindings(user: AuthenticatedUser) {
    const distributor = await this.loadDistributor(user);

    const [items, total] = await Promise.all([
      this.prisma.binding.findMany({
        where: {
          tenantId: user.tenantId!,
          distributorId: distributor.id,
        },
        orderBy: { boundAt: 'desc' },
      }),
      this.prisma.binding.count({
        where: {
          tenantId: user.tenantId!,
          distributorId: distributor.id,
        },
      }),
    ]);

    return {
      items: items.map((b) => ({
        id: b.id,
        bindableType: b.bindableType,
        bindableId: b.bindableId,
        boundAt: b.boundAt.toISOString(),
      })),
      total,
    };
  }
}
