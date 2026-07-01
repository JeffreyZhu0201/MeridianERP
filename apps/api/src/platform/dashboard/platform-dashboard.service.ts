import { Injectable } from '@nestjs/common';
import { LedgerStatus, OnboardingStatus, OrderStatus } from '@prisma/client';
import type { PlatformDashboardStats } from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { dashboardWindowStart } from '../../common/date-range';
import { buildOrderTrend } from '../../common/dashboard-trend';
import { decimalSumToString } from '../../merchant/commissions/commission-mappers';

/**
 * 平台仪表盘服务 - 提供平台运营数据的汇总统计
 *
 * 功能范围：
 * - 商户总数、待审核数统计
 * - 活跃经销商数统计
 * - 近30天绑定数统计
 * - 佣金应计/已结统计
 * - 订单数量和金额统计
 * - 订单趋势数据
 * - 最近入驻商户列表
 *
 * 数据时间范围：默认近30天（由 dashboardWindowStart() 定义）
 */
@Injectable()
export class PlatformDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取平台仪表盘统计数据
   *
   * 返回平台运营的核心指标，用于管理后台仪表盘展示。
   *
   * @returns 平台仪表盘统计数据
   */
  async getStats(): Promise<PlatformDashboardStats> {
    const windowStart = dashboardWindowStart();
    const windowEnd = new Date();

    const [
      totalMerchants,
      pendingReview,
      activeDistributors,
      bindingsLast30Days,
      commissionAccruedAgg,
      commissionSettledAgg,
      orderAgg,
      trendOrders,
      recentMerchants,
    ] = await Promise.all([
      this.prisma.merchantProfile.count(),
      this.prisma.merchantProfile.count({
        where: {
          onboardingStatus: {
            in: [OnboardingStatus.SUBMITTED, OnboardingStatus.UNDER_REVIEW],
          },
        },
      }),
      this.prisma.distributor.count({ where: { isActive: true } }),
      this.prisma.binding.count({ where: { boundAt: { gte: windowStart } } }),
      this.prisma.commissionLedger.aggregate({
        where: {
          status: LedgerStatus.ACCRUED,
          createdAt: { gte: windowStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: {
          status: LedgerStatus.SETTLED,
          createdAt: { gte: windowStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: OrderStatus.PAID,
          createdAt: { gte: windowStart },
        },
        _count: { _all: true },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: {
          status: OrderStatus.PAID,
          createdAt: { gte: windowStart, lte: windowEnd },
        },
        select: {
          createdAt: true,
          total: true,
          commissionEntry: { select: { amount: true, status: true } },
        },
      }),
      this.prisma.merchantProfile.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          businessName: true,
          contactEmail: true,
          onboardingStatus: true,
          submittedAt: true,
        },
      }),
    ]);

    return {
      totalMerchants,
      pendingReview,
      activeDistributors,
      bindingsLast30Days,
      commissionAccruedLast30Days: decimalSumToString(commissionAccruedAgg._sum.amount),
      commissionSettledLast30Days: decimalSumToString(commissionSettledAgg._sum.amount),
      ordersLast30Days: orderAgg._count._all,
      orderRevenueLast30Days: decimalSumToString(orderAgg._sum.total),
      trend: buildOrderTrend(windowStart, windowEnd, trendOrders),
      recentMerchants: recentMerchants.map((merchant) => ({
        id: merchant.id,
        businessName: merchant.businessName,
        contactEmail: merchant.contactEmail,
        onboardingStatus: merchant.onboardingStatus,
        submittedAt: merchant.submittedAt?.toISOString(),
      })),
    };
  }
}
