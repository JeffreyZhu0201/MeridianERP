import { Injectable } from '@nestjs/common';
import { LedgerStatus, OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { dashboardWindowStart } from '../../common/date-range';

@Injectable()
export class PlatformFundsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const from = dashboardWindowStart();
    const orderWhere = {
      status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },
      createdAt: { gte: from },
    };

    const [
      orderAgg,
      deliveryCount,
      allocationAgg,
      commissionAccrued,
      commissionSettled,
      pendingWithdrawals,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: orderWhere,
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.order.count({
        where: { ...orderWhere, fulfillmentType: 'DELIVERY' },
      }),
      this.prisma.deliveryAllocationLedger.aggregate({
        where: { createdAt: { gte: from } },
        _sum: { lineTotal: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: { status: LedgerStatus.ACCRUED, createdAt: { gte: from } },
        _sum: { amount: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: { status: LedgerStatus.SETTLED, createdAt: { gte: from } },
        _sum: { amount: true },
      }),
      this.prisma.withdrawalRequest.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
    ]);

    const allocationCost = await this.prisma.allocationOrderLine.aggregate({
      where: {
        allocationOrder: {
          status: 'CONFIRMED',
          confirmedAt: { gte: from },
        },
      },
      _sum: { wholesalePrice: true },
    });

    const wholesaleFromAlloc = Number(allocationCost._sum.wholesalePrice ?? 0);
    const wholesaleFromDelivery = Number(allocationAgg._sum.lineTotal ?? 0);

    return {
      gmvLast30Days: Number(orderAgg._sum.total ?? 0),
      wholesaleRevenueLast30Days: wholesaleFromAlloc + wholesaleFromDelivery,
      commissionAccruedLast30Days: Number(commissionAccrued._sum.amount ?? 0),
      commissionSettledLast30Days: Number(commissionSettled._sum.amount ?? 0),
      pendingWithdrawals: Number(pendingWithdrawals._sum.amount ?? 0),
      orderCountLast30Days: orderAgg._count._all,
      deliveryOrderCountLast30Days: deliveryCount,
    };
  }
}

@Injectable()
export class MerchantFundsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string, from?: Date, to?: Date) {
    const rangeFrom = from ?? dashboardWindowStart();
    const rangeTo = to ?? new Date();

    const orderWhere = {
      tenantId,
      status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },
      createdAt: { gte: rangeFrom, lte: rangeTo },
    };

    const [salesAgg, allocationLines, deliveryLedgers, commissionAgg] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: orderWhere,
          _sum: { total: true },
        }),
        this.prisma.allocationOrderLine.findMany({
          where: {
            allocationOrder: {
              tenantId,
              status: 'CONFIRMED',
              confirmedAt: { gte: rangeFrom, lte: rangeTo },
            },
          },
          select: { quantity: true, wholesalePrice: true },
        }),
        this.prisma.deliveryAllocationLedger.aggregate({
          where: { tenantId, createdAt: { gte: rangeFrom, lte: rangeTo } },
          _sum: { lineTotal: true },
        }),
        this.prisma.commissionLedger.aggregate({
          where: {
            tenantId,
            status: { in: [LedgerStatus.ACCRUED, LedgerStatus.SETTLED] },
            createdAt: { gte: rangeFrom, lte: rangeTo },
          },
          _sum: { amount: true },
        }),
      ]);

    const allocationCost = allocationLines.reduce(
      (sum, l) => sum + Number(l.wholesalePrice) * l.quantity,
      0,
    );
    const deliveryCost = Number(deliveryLedgers._sum.lineTotal ?? 0);
    const salesGmv = Number(salesAgg._sum.total ?? 0);
    const payableCommission = Number(commissionAgg._sum.amount ?? 0);
    const netPosition = salesGmv - allocationCost - deliveryCost - payableCommission;

    return {
      salesGmv,
      allocationCost,
      deliveryAllocationCost: deliveryCost,
      payableCommission,
      netPosition,
      from: rangeFrom.toISOString(),
      to: rangeTo.toISOString(),
    };
  }
}
