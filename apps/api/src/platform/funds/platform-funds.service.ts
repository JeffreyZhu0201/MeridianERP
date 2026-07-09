import { Injectable } from '@nestjs/common';
import {
  BranchPurchaseOrderStatus,
  CommissionSource,
  FulfillmentType,
  LedgerStatus,
  OrderStatus,
} from '@prisma/client';
import {
  computeBranchNetPosition,
  computeCommissionLiability,
  computeExpectedInventoryProfit,
  computeInventoryCost,
  computePlatformNetProfit,
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
            unitWholesalePrice:
              l.unitWholesalePrice != null
                ? Number(l.unitWholesalePrice)
                : null,
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

  async getOverview(query: DateRangeQuery = {}) {
    const { from, to, fromIso, toIso } = parseDateRangeQuery(query);
    const period = await this.loadPeriodMetrics(from, to);

    const masterSkus = await this.prisma.masterSku.findMany({
      select: { quantityOnHand: true, unitCost: true, wholesalePrice: true },
    });
    const inventoryCost = computeInventoryCost(
      masterSkus.map((sku) => ({
        quantityOnHand: sku.quantityOnHand,
        unitCost: sku.unitCost.toString(),
      })),
    );
    const expectedProfit = computeExpectedInventoryProfit(
      masterSkus.map((sku) => ({
        quantityOnHand: sku.quantityOnHand,
        unitCost: sku.unitCost.toString(),
        wholesalePrice: sku.wholesalePrice.toString(),
      })),
    );

    return {
      inventoryCost,
      expectedProfit,
      procurementSales: period.procurementSales,
      procurementProfit: period.procurementProfit,
      distributorCommissions: period.distributorCommissions,
      netProfit: period.netProfit,
      from: fromIso,
      to: toIso,
    };
  }

  async getInventoryCostDetail(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [skus, total, allForSum] = await Promise.all([
      this.prisma.masterSku.findMany({
        skip,
        take: limit,
        orderBy: { skuCode: 'asc' },
        select: {
          id: true,
          skuCode: true,
          name: true,
          quantityOnHand: true,
          unitCost: true,
        },
      }),
      this.prisma.masterSku.count(),
      this.prisma.masterSku.findMany({
        select: { quantityOnHand: true, unitCost: true },
      }),
    ]);
    return {
      data: skus.map((sku) => ({
        id: sku.id,
        skuCode: sku.skuCode,
        name: sku.name,
        quantityOnHand: sku.quantityOnHand,
        unitCost: sku.unitCost.toString(),
        lineCost: Number(
          (sku.quantityOnHand * Number(sku.unitCost)).toFixed(2),
        ),
      })),
      meta: { total, page, limit },
      totalCost: computeInventoryCost(
        allForSum.map((sku) => ({
          quantityOnHand: sku.quantityOnHand,
          unitCost: sku.unitCost.toString(),
        })),
      ),
    };
  }

  async getExpectedProfitDetail(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [skus, total, allForSum] = await Promise.all([
      this.prisma.masterSku.findMany({
        skip,
        take: limit,
        orderBy: { skuCode: 'asc' },
        select: {
          id: true,
          skuCode: true,
          name: true,
          quantityOnHand: true,
          unitCost: true,
          wholesalePrice: true,
        },
      }),
      this.prisma.masterSku.count(),
      this.prisma.masterSku.findMany({
        select: { quantityOnHand: true, unitCost: true, wholesalePrice: true },
      }),
    ]);
    return {
      data: skus.map((sku) => {
        const margin = Number(sku.wholesalePrice) - Number(sku.unitCost);
        return {
          id: sku.id,
          skuCode: sku.skuCode,
          name: sku.name,
          quantityOnHand: sku.quantityOnHand,
          unitCost: sku.unitCost.toString(),
          wholesalePrice: sku.wholesalePrice.toString(),
          expectedProfit: Number((sku.quantityOnHand * margin).toFixed(2)),
        };
      }),
      meta: { total, page, limit },
      totalExpectedProfit: computeExpectedInventoryProfit(
        allForSum.map((sku) => ({
          quantityOnHand: sku.quantityOnHand,
          unitCost: sku.unitCost.toString(),
          wholesalePrice: sku.wholesalePrice.toString(),
        })),
      ),
    };
  }

  async getProcurementDetail(query: DateRangeQuery = {}, page = 1, limit = 20) {
    const { from, to, fromIso, toIso } = parseDateRangeQuery(query);
    const skip = (page - 1) * limit;
    const where = {
      paidAt: { gte: from, lte: to },
      status: {
        in: [
          BranchPurchaseOrderStatus.PROCESSING,
          BranchPurchaseOrderStatus.SHIPPED,
          BranchPurchaseOrderStatus.RECEIVED,
        ],
      },
    };

    const [orders, total, periodTotals] = await Promise.all([
      this.prisma.branchPurchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: {
          tenant: {
            select: {
              merchantProfile: { select: { businessName: true } },
              slug: true,
            },
          },
          lines: {
            include: { masterSku: { select: { unitCost: true } } },
          },
        },
      }),
      this.prisma.branchPurchaseOrder.count({ where }),
      this.loadPeriodMetrics(from, to),
    ]);

    const data = orders.map((order) => {
      const salesAmount = Number(order.totalAmount);
      const costAmount = order.lines.reduce(
        (sum, line) =>
          sum + line.quantityOrdered * Number(line.masterSku.unitCost),
        0,
      );
      const profitAmount = Number((salesAmount - costAmount).toFixed(2));
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        merchantName:
          order.tenant.merchantProfile?.businessName ?? order.tenant.slug,
        status: order.status,
        salesAmount,
        costAmount: Number(costAmount.toFixed(2)),
        profitAmount,
        paidAt: order.paidAt?.toISOString() ?? null,
      };
    });

    return {
      data,
      meta: { total, page, limit },
      totalSales: periodTotals.procurementSales,
      totalProfit: periodTotals.procurementProfit,
      from: fromIso,
      to: toIso,
    };
  }

  async getCommissionsDetail(query: DateRangeQuery = {}, page = 1, limit = 20) {
    const { from, to, fromIso, toIso } = parseDateRangeQuery(query);
    const skip = (page - 1) * limit;
    const where = {
      commissionSource: CommissionSource.ALLOCATION,
      createdAt: { gte: from, lte: to },
    };

    const [entries, total, agg] = await Promise.all([
      this.prisma.commissionLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          distributor: { select: { name: true } },
          tenant: {
            select: {
              slug: true,
              merchantProfile: { select: { businessName: true } },
            },
          },
        },
      }),
      this.prisma.commissionLedger.count({ where }),
      this.prisma.commissionLedger.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      data: entries.map((entry) => ({
        id: entry.id,
        distributorName: entry.distributor.name,
        merchantLabel:
          entry.tenant.merchantProfile?.businessName ?? entry.tenant.slug,
        amount: Number(entry.amount),
        status: entry.status,
        createdAt: entry.createdAt.toISOString(),
      })),
      meta: { total, page, limit },
      totalCommissions: Number(agg._sum.amount ?? 0),
      from: fromIso,
      to: toIso,
    };
  }

  async getNetProfitBreakdown(query: DateRangeQuery = {}) {
    const { from, to, fromIso, toIso } = parseDateRangeQuery(query);
    const period = await this.loadPeriodMetrics(from, to);
    return {
      wholesaleFromAllocations: period.wholesaleFromAllocations,
      wholesaleFromDelivery: period.wholesaleFromDelivery,
      totalRevenue: period.wholesaleRevenue,
      cogsFromAllocations: period.cogsFromAllocations,
      cogsFromDelivery: period.cogsFromDelivery,
      totalCogs: period.totalCogs,
      distributorCommissions: period.distributorCommissions,
      netProfit: period.netProfit,
      from: fromIso,
      to: toIso,
    };
  }

  private async loadPeriodMetrics(from: Date, to: Date) {
    const paidProcurementWhere = {
      paidAt: { gte: from, lte: to },
      status: {
        in: [
          BranchPurchaseOrderStatus.PROCESSING,
          BranchPurchaseOrderStatus.SHIPPED,
          BranchPurchaseOrderStatus.RECEIVED,
        ],
      },
    };

    const [
      allocationLines,
      deliveryLedgers,
      deliveryAgg,
      commissionAccrued,
      commissionSettled,
      procurementOrders,
    ] = await Promise.all([
      this.prisma.allocationOrderLine.findMany({
        where: {
          allocationOrder: {
            status: 'CONFIRMED',
            confirmedAt: { gte: from, lte: to },
          },
        },
        select: {
          quantity: true,
          wholesalePrice: true,
          masterSku: { select: { unitCost: true } },
        },
      }),
      this.prisma.deliveryAllocationLedger.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: {
          quantity: true,
          lineTotal: true,
          masterSku: { select: { unitCost: true } },
        },
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
      this.prisma.branchPurchaseOrder.findMany({
        where: paidProcurementWhere,
        select: {
          totalAmount: true,
          lines: {
            select: {
              quantityOrdered: true,
              unitWholesalePrice: true,
              masterSku: { select: { unitCost: true } },
            },
          },
        },
      }),
    ]);

    const wholesaleFromAllocations = sumAllocationLineCost(
      allocationLines.map((l) => ({
        quantity: l.quantity,
        wholesalePrice: Number(l.wholesalePrice),
      })),
    );
    const wholesaleFromDelivery = Number(deliveryAgg._sum.lineTotal ?? 0);
    const wholesaleRevenue = computePlatformWholesaleRevenue(
      wholesaleFromAllocations,
      wholesaleFromDelivery,
    );

    const cogsFromAllocations = allocationLines.reduce(
      (sum, line) => sum + line.quantity * Number(line.masterSku.unitCost),
      0,
    );
    const cogsFromDelivery = deliveryLedgers.reduce(
      (sum, line) => sum + line.quantity * Number(line.masterSku.unitCost),
      0,
    );
    const totalCogs = Number(
      (cogsFromAllocations + cogsFromDelivery).toFixed(2),
    );

    const accrued = Number(commissionAccrued._sum.amount ?? 0);
    const settled = Number(commissionSettled._sum.amount ?? 0);
    const distributorCommissions = computeCommissionLiability(accrued, settled);

    let procurementSales = 0;
    let procurementProfit = 0;
    for (const order of procurementOrders) {
      const salesAmount = Number(order.totalAmount);
      const costAmount = order.lines.reduce(
        (sum, line) =>
          sum + line.quantityOrdered * Number(line.masterSku.unitCost),
        0,
      );
      procurementSales += salesAmount;
      procurementProfit += salesAmount - costAmount;
    }

    const netProfit = computePlatformNetProfit({
      wholesaleRevenue,
      cogs: totalCogs,
      distributorCommissions,
    });

    return {
      wholesaleFromAllocations,
      wholesaleFromDelivery,
      wholesaleRevenue,
      cogsFromAllocations: Number(cogsFromAllocations.toFixed(2)),
      cogsFromDelivery: Number(cogsFromDelivery.toFixed(2)),
      totalCogs,
      distributorCommissions,
      procurementSales: Number(procurementSales.toFixed(2)),
      procurementProfit: Number(procurementProfit.toFixed(2)),
      netProfit,
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
            unitWholesalePrice:
              l.unitWholesalePrice != null
                ? Number(l.unitWholesalePrice)
                : null,
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
