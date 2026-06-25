import { Injectable } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import type {
  MerchantDashboardActivity,
  MerchantDashboardStats,
} from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { dashboardWindowStart } from '../../common/date-range';

const RECENT_ACTIVITY_DAYS = 7;

@Injectable()
export class MerchantDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(tenantId: string, days = 30): Promise<MerchantDashboardStats> {
    const windowStart = dashboardWindowStart(days);
    const activityStart = dashboardWindowStart(RECENT_ACTIVITY_DAYS);
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId },
    });

    const [
      contactsCount,
      openLeads,
      activeDistributors,
      recentBindings,
      recentLeads,
      activityBindings,
      activityCommissions,
    ] = await Promise.all([
      this.prisma.crmContact.count({ where: { tenantId } }),
      this.prisma.crmLead.count({
        where: {
          tenantId,
          stage: { in: [LeadStage.NEW, LeadStage.QUALIFIED] },
        },
      }),
      this.prisma.distributor.count({ where: { tenantId, isActive: true } }),
      this.prisma.binding.count({
        where: { tenantId, boundAt: { gte: windowStart } },
      }),
      this.prisma.crmLead.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          stage: true,
          source: true,
          updatedAt: true,
        },
      }),
      this.prisma.binding.findMany({
        where: { tenantId, boundAt: { gte: activityStart } },
        include: { distributor: { select: { id: true, name: true } } },
        orderBy: { boundAt: 'desc' },
      }),
      this.prisma.commissionLedger.findMany({
        where: { tenantId, createdAt: { gte: activityStart } },
        include: { distributor: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const recentActivity = this.buildRecentActivity(
      activityBindings,
      activityCommissions,
    );

    return {
      businessName: profile?.businessName ?? 'Merchant',
      contactsCount,
      openLeads,
      activeDistributors,
      recentBindings,
      recentLeads: recentLeads.map((lead) => ({
        id: lead.id,
        title: lead.title,
        stage: lead.stage,
        source: lead.source,
        updatedAt: lead.updatedAt.toISOString(),
      })),
      recentActivity,
    };
  }

  private buildRecentActivity(
    bindings: Array<{
      distributorId: string;
      bindableType: string;
      boundAt: Date;
      distributor: { id: string; name: string };
    }>,
    commissions: Array<{
      orderId: string;
      distributorId: string;
      amount: { toString(): string };
      createdAt: Date;
      distributor: { id: string; name: string };
    }>,
  ): MerchantDashboardActivity[] {
    const bindingEvents: MerchantDashboardActivity[] = bindings.map(
      (binding) => ({
        type: 'binding.created',
        occurredAt: binding.boundAt.toISOString(),
        distributorId: binding.distributorId,
        distributorName: binding.distributor.name,
        bindType: binding.bindableType,
      }),
    );

    const commissionEvents: MerchantDashboardActivity[] = commissions.map(
      (entry) => ({
        type: 'commission.accrued',
        occurredAt: entry.createdAt.toISOString(),
        distributorId: entry.distributorId,
        distributorName: entry.distributor.name,
        orderId: entry.orderId,
        amount: entry.amount.toString(),
      }),
    );

    return [...bindingEvents, ...commissionEvents].sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }
}
