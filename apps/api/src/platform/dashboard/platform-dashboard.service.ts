import { Injectable } from '@nestjs/common';
import { LedgerStatus, OnboardingStatus, OrderStatus } from '@prisma/client';
import type { PlatformDashboardStats } from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { dashboardWindowStart } from '../../common/date-range';
import { buildOrderTrend } from '../../common/dashboard-trend';
import { decimalSumToString } from '../../merchant/commissions/commission-mappers';

@Injectable()
export class PlatformDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<PlatformDashboardStats> {
    const windowStart = dashboardWindowStart();
    const windowEnd = new Date();

    const [
      totalMerchants,
      pendingReview,
      activeDistributors,
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
      this.prisma.distributor.count({
        where: { tenantId: null, isActive: true },
      }),
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
      commissionAccruedLast30Days: decimalSumToString(
        commissionAccruedAgg._sum.amount,
      ),
      commissionSettledLast30Days: decimalSumToString(
        commissionSettledAgg._sum.amount,
      ),
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
