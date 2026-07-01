import { Injectable } from '@nestjs/common';
import { LedgerStatus, OrderStatus } from '@prisma/client';
import {
  computeCommissionLiability,
  computePlatformWholesaleRevenue,
  sumAllocationLineCost,
  computeBranchNetPosition,
} from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { eachUtcDay, parseDateRangeQuery } from '../../common/date-range';
import type { DateRangeQuery } from '@meridian/shared';

/**
 * 平台资金服务 - 提供平台级别的资金汇总和统计分析
 *
 * 功能范围：
 * - GMV（商品交易总额）统计
 * - 批发收入计算（来自配额分配和配送业务）
 * - 佣金应计/已结统计及负债计算
 * - 待处理提现统计
 * - GMV 趋势分析（按日）
 */
@Injectable()
export class PlatformFundsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取平台资金汇总数据
   *
   * 统计指标说明：
   * - gmv: 已支付/已履约订单的总金额
   * - wholesaleRevenue: 平台从批发渠道获得的收入（配额批发价 + 配送批发价）
   * - commissionAccrued: 累计应计佣金（待结算）
   * - commissionSettled: 已结算佣金
   * - commissionLiability: 佣金负债（应计 - 已结）
   * - pendingWithdrawals: 待处理提现金额
   *
   * @param query - 日期范围查询参数（可选，默认近30天）
   * @returns 资金汇总对象，包含各项统计指标和 GMV 趋势
   */
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
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: orderWhere,
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.order.count({
        where: { ...orderWhere, fulfillmentType: 'DELIVERY' },
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
        where: { status: LedgerStatus.ACCRUED, createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: { status: LedgerStatus.SETTLED, createdAt: { gte: from, lte: to } },
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

    const gmvTrend = this.buildGmvTrend(ordersForTrend, from, to);

    return {
      /** 商品交易总额（已支付/已履约订单） */
      gmv: Number(orderAgg._sum.total ?? 0),
      /** 平台批发收入（配额批发 + 配送批发） */
      wholesaleRevenue: computePlatformWholesaleRevenue(
        wholesaleFromAlloc,
        wholesaleFromDelivery,
      ),
      /** 累计应计佣金（待结算状态） */
      commissionAccrued: accrued,
      /** 已结算佣金总额 */
      commissionSettled: settled,
      /** 佣金负债 = 应计 - 已结 */
      commissionLiability: computeCommissionLiability(accrued, settled),
      /** 待结算佣金（与 commissionAccrued 相同） */
      accruedAwaitingSettlement: accrued,
      /** 待处理提现申请总额 */
      pendingWithdrawals: Number(pendingWithdrawals._sum.amount ?? 0),
      /** 订单总数 */
      orderCount: orderAgg._count._all,
      /** 配送订单数量 */
      deliveryOrderCount: deliveryCount,
      /** 查询起始日期（ISO 格式） */
      from: fromIso,
      /** 查询结束日期（ISO 格式） */
      to: toIso,
      /** GMV 每日趋势数据 */
      gmvTrend,
    };
  }

  /**
   * 构建 GMV 趋势数据
   *
   * 将订单数据按日期聚合，生成每日 GMV 序列。
   * 用于前端绘制趋势图表，即使某天无订单也会返回零值。
   *
   * @param orders - 订单列表（需包含 total 和 createdAt）
   * @param from - 起始日期
   * @param to - 结束日期
   * @returns 每日 GMV 数组，按日期升序排列
   */
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

/**
 * 商户资金服务 - 提供商户（租户）级别的资金汇总
 *
 * 功能范围：
 * - 商户销售额统计（GMV）
 * - 配额成本计算（从平台采购的成本）
 * - 配送成本计算
 * - 应付佣金统计
 * - 净仓位计算（销售额 - 成本 - 佣金）
 *
 * 与平台资金服务的区别：
 * - 平台服务看全局，经商户服务看单个租户
 * - 商户服务包含成本和净仓位计算
 */
@Injectable()
export class MerchantFundsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取商户资金汇总
   *
   * 统计指标说明：
   * - salesGmv: 商户销售总额（从消费者获得的收入）
   * - allocationCost: 配额采购成本（从平台采购商品的成本）
   * - deliveryAllocationCost: 配送配额成本
   * - payableCommission: 应付佣金（需支付给经销商）
   * - netPosition: 净仓位 = 销售额 - 配额成本 - 配送成本 - 应付佣金
   *
   * @param tenantId - 商户租户 ID
   * @param query - 日期范围查询参数（可选）
   * @returns 商户资金汇总对象
   */
  async getSummary(tenantId: string, query: DateRangeQuery = {}) {
    const { from, to, fromIso, toIso } = parseDateRangeQuery(query);

    const orderWhere = {
      tenantId,
      status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },
      createdAt: { gte: from, lte: to },
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
              confirmedAt: { gte: from, lte: to },
            },
          },
          select: { quantity: true, wholesalePrice: true },
        }),
        this.prisma.deliveryAllocationLedger.aggregate({
          where: { tenantId, createdAt: { gte: from, lte: to } },
          _sum: { lineTotal: true },
        }),
        this.prisma.commissionLedger.aggregate({
          where: {
            tenantId,
            status: { in: [LedgerStatus.ACCRUED, LedgerStatus.SETTLED] },
            createdAt: { gte: from, lte: to },
          },
          _sum: { amount: true },
        }),
      ]);

    const allocationCost = sumAllocationLineCost(
      allocationLines.map((l) => ({
        quantity: l.quantity,
        wholesalePrice: Number(l.wholesalePrice),
      })),
    );
    const deliveryCost = Number(deliveryLedgers._sum.lineTotal ?? 0);
    const salesGmv = Number(salesAgg._sum.total ?? 0);
    const payableCommission = Number(commissionAgg._sum.amount ?? 0);
    const netPosition = computeBranchNetPosition({
      salesGmv,
      allocationCost,
      deliveryCost,
      payableCommission,
    });

    return {
      /** 商户销售总额（GMV） */
      salesGmv,
      /** 配额采购成本（从平台采购） */
      allocationCost,
      /** 配送配额成本 */
      deliveryAllocationCost: deliveryCost,
      /** 应付佣金（给经销商） */
      payableCommission,
      /** 净仓位 = 销售额 - 配额成本 - 配送成本 - 应付佣金 */
      netPosition,
      /** 查询起始日期（ISO 格式） */
      from: fromIso,
      /** 查询结束日期（ISO 格式） */
      to: toIso,
    };
  }
}
