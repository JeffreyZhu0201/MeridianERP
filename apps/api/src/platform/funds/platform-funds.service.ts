import { Injectable } from '@nestjs/common';
import {
  CommissionSource,
  FulfillmentType,
  LedgerStatus,
  OrderStatus,
} from '@prisma/client';
import {
  computeBranchNetPosition,
  computeCommissionLiability,
  computePlatformWholesaleRevenue,
  pickupOrderGrossProfit,
  sumAllocationLineCost,
} from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { eachUtcDay, parseDateRangeQuery } from '../../common/date-range';
import type { DateRangeQuery } from '@meridian/shared';

@Injectable()
export class PlatformFundsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(query: DateRangeQuery = {}) {
    const { from, to, fromIso, toIso } = parseDateRangeQuery(query);

    const orderWhere = {
      status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },
      createdAt: { gte: from, lte: to },
    };

    const [
      orderAgg,
      deliveryCount,
      allocationLines,
      deliveryAgg,
      commissionAccrued,
      commissionSettled,
      pendingWithdrawals,
      ordersForTrend,
      pickupOrders,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: orderWhere,
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.order.count({
        where: { ...orderWhere, fulfillmentType: FulfillmentType.DELIVERY },
      }),
      this.prisma.allocationOrderLine.findMany({
        where: {
          allocationOrder: {
            status: 'CONFIRMED',
            confirmedAt: { gte: from, lte: to },
          },
        },
        select: { quantity: true, wholesalePrice: true },
      }),
      this.prisma.deliveryAllocationLedger.aggregate({
        where: { createdAt: { gte: from, lte: to } },
        _sum: { lineTotal: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: {
          commissionSource: CommissionSource.ALLOCATION,
          status: LedgerStatus.ACCRUED,
          createdAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: {
          commissionSource: CommissionSource.ALLOCATION,
          status: LedgerStatus.SETTLED,
          createdAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      this.prisma.withdrawalRequest.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.order.findMany({
        where: orderWhere,
        select: { total: true, createdAt: true },
      }),
      this.prisma.order.findMany({
        where: {
          ...orderWhere,
          fulfillmentType: FulfillmentType.PICKUP,
          status: OrderStatus.FULFILLED,
        },
        select: {
          total: true,
          lines: { select: { quantity: true, unitWholesalePrice: true } },
        },
      }),
    ]);

    const wholesaleFromAlloc = sumAllocationLineCost(
      allocationLines.map((l) => ({
        quantity: l.quantity,
        wholesalePrice: Number(l.wholesalePrice),
      })),
    );
    const wholesaleFromDelivery = Number(deliveryAgg._sum.lineTotal ?? 0);
    const accrued = Number(commissionAccrued._sum.amount ?? 0);
    const settled = Number(commissionSettled._sum.amount ?? 0);
    const consumerGmv = Number(orderAgg._sum.total ?? 0);
    const pickupMarginAcrossBranches = pickupOrders.reduce(
      (sum, order) =>
        sum +
        pickupOrderGrossProfit(
          Number(order.total),
          order.lines.map((l) => ({
            quantity: l.quantity,
            unitWholesalePrice: l.unitWholesalePrice,
          })),
        ),
      0,
    );

    const gmvTrend = this.buildGmvTrend(ordersForTrend, from, to);

    return {
      consumerGmv,
      gmv: consumerGmv,
      wholesaleFromAllocations: wholesaleFromAlloc,
      wholesaleFromDelivery,
      wholesaleRevenue: computePlatformWholesaleRevenue(
        wholesaleFromAlloc,
        wholesaleFromDelivery,
      ),
      distributorCommissionAccrued: accrued,
      distributorCommissionSettled: settled,
      commissionAccrued: accrued,
      commissionSettled: settled,
      commissionLiability: computeCommissionLiability(accrued, settled),
      accruedAwaitingSettlement: accrued,
      pendingWithdrawals: Number(pendingWithdrawals._sum.amount ?? 0),
      pickupMarginAcrossBranches,
      orderCount: orderAgg._count._all,
      deliveryOrderCount: deliveryCount,
      from: fromIso,
      to: toIso,
      gmvTrend,
    };
  }

  private buildGmvTrend(
    orders: Array<{ total: unknown; createdAt: Date }>,
    from: Date,
    to: Date,
  ): Array<{ date: string; amount: number }> {
    const days = eachUtcDay(from, to);
    const byDay = new Map<string, number>(days.map((d) => [d, 0]));
    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (byDay.has(key)) {
        byDay.set(key, (byDay.get(key) ?? 0) + Number(order.total));
      }
    }
    return days.map((date) => ({ date, amount: byDay.get(date) ?? 0 }));
  }
}

@Injectable()
export class MerchantFundsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string, query: DateRangeQuery = {}) {
    const { from, to, fromIso, toIso } = parseDateRangeQuery(query);

    const pickupOrderWhere = {
      tenantId,
      status: OrderStatus.FULFILLED,
      fulfillmentType: FulfillmentType.PICKUP,
      pickupVerifiedAt: { gte: from, lte: to },
    };

    const [pickupOrders, allocationLines, deliveryLedgers] = await Promise.all([
      this.prisma.order.findMany({
        where: pickupOrderWhere,
        select: {
          total: true,
          lines: { select: { quantity: true, unitWholesalePrice: true } },
        },
      }),
      this.prisma.allocationOrderLine.findMany({
        where: {
          allocationOrder: {
            tenantId,
            status: 'CONFIRMED',
            confirmedAt: { gte: from, lte: to },
          },
        },
        select: { quantity: true, wholesalePrice: true },
      }),
      this.prisma.deliveryAllocationLedger.aggregate({
        where: { tenantId, createdAt: { gte: from, lte: to } },
        _sum: { lineTotal: true },
      }),
    ]);

    const pickupGmv = pickupOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const pickupCostOfGoods = pickupOrders.reduce((sum, order) => {
      const cost = order.lines.reduce(
        (lineSum, line) =>
          lineSum +
          (line.unitWholesalePrice != null
            ? Number(line.unitWholesalePrice) * line.quantity
            : 0),
        0,
      );
      return sum + cost;
    }, 0);
    const pickupGrossProfit = pickupOrders.reduce(
      (sum, order) =>
        sum +
        pickupOrderGrossProfit(
          Number(order.total),
          order.lines.map((l) => ({
            quantity: l.quantity,
            unitWholesalePrice: l.unitWholesalePrice,
          })),
        ),
      0,
    );
    const allocationCost = sumAllocationLineCost(
      allocationLines.map((l) => ({
        quantity: l.quantity,
        wholesalePrice: Number(l.wholesalePrice),
      })),
    );
    const deliveryCost = Number(deliveryLedgers._sum.lineTotal ?? 0);
    const netPosition = computeBranchNetPosition({
      pickupGrossProfit,
      allocationCost,
      deliveryCost,
    });

    return {
      pickupGmv,
      pickupCostOfGoods,
      pickupGrossProfit,
      salesGmv: pickupGmv,
      allocationCost,
      deliveryAllocationCost: deliveryCost,
      netPosition,
      from: fromIso,
      to: toIso,
    };
  }
}
