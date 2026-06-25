import { Injectable } from '@nestjs/common';
import { LedgerStatus, OnboardingStatus } from '@prisma/client';
import type { PlatformDashboardStats } from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { dashboardWindowStart } from '../../common/date-range';
import { decimalSumToString } from '../../merchant/commissions/commission-mappers';

@Injectable()
export class PlatformDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<PlatformDashboardStats> {
    const windowStart = dashboardWindowStart();

    const [
      totalMerchants,
      pendingReview,
      activeDistributors,
      bindingsLast30Days,
      commissionAgg,
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
      commissionAccruedLast30Days: decimalSumToString(commissionAgg._sum.amount),
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
