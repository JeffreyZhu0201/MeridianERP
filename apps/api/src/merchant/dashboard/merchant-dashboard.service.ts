import { Injectable } from '@nestjs/common';
import { LeadStage, LedgerStatus, OrderStatus } from '@prisma/client';
import type {
  MerchantDashboardActivity,
  MerchantDashboardStats,
} from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { dashboardWindowStart } from '../../common/date-range';
import { buildOrderTrend } from '../../common/dashboard-trend';
import { decimalSumToString } from '../commissions/commission-mappers';

const RECENT_ACTIVITY_DAYS = 7;

@Injectable()
export class MerchantDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(tenantId: string, days = 30): Promise<MerchantDashboardStats> {
    const windowStart = dashboardWindowStart(days);
    const windowEnd = new Date();
    const activityStart = dashboardWindowStart(RECENT_ACTIVITY_DAYS);
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId },
    });

    const orderWhere = {
      tenantId,
      status: OrderStatus.PAID,
      createdAt: { gte: windowStart },
    };

    const [
      contactsCount,
      openLeads,
      activeDistributors,
      recentBindings,
      orderAgg,
      commissionAccruedAgg,
      lowStockCount,
      trendOrders,
      recentLeads,
      activityBindings,
      activityCommissions,
      activityOrders,
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
      this.prisma.order.aggregate({
        where: orderWhere,
        _count: { _all: true },
        _sum: { total: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: {
          tenantId,
          status: LedgerStatus.ACCRUED,
          createdAt: { gte: windowStart },
        },
        _sum: { amount: true },
      }),
      this.countLowStock(tenantId),
      this.prisma.order.findMany({
        where: {
          ...orderWhere,
          createdAt: { gte: windowStart, lte: windowEnd },
        },
        select: {
          createdAt: true,
          total: true,
          commissionEntry: { select: { amount: true, status: true } },
        },
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
      this.prisma.order.findMany({
        where: {
          tenantId,
          status: OrderStatus.PAID,
          createdAt: { gte: activityStart },
        },
        include: { distributor: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const recentActivity = this.buildRecentActivity(
      activityBindings,
      activityCommissions,
      activityOrders,
    );

    return {
      businessName: profile?.businessName ?? 'Merchant',
      contactsCount,
      openLeads,
      activeDistributors,
      recentBindings,
      ordersLast30Days: orderAgg._count._all,
      revenueLast30Days: decimalSumToString(orderAgg._sum.total),
      commissionAccruedLast30Days: decimalSumToString(
        commissionAccruedAgg._sum.amount,
      ),
      lowStockCount,
      trend: buildOrderTrend(windowStart, windowEnd, trendOrders),
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

  private async countLowStock(tenantId: string): Promise<number> {
    const settings = await this.prisma.tenantInventorySettings.findUnique({
      where: { tenantId },
    });
    const defaultThreshold = settings?.defaultReorderThreshold ?? 5;
    const defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { tenantId, isDefault: true },
    });
    if (!defaultWarehouse) return 0;

    const levels = await this.prisma.stockLevel.findMany({
      where: { tenantId, warehouseId: defaultWarehouse.id },
      include: { variant: { select: { reorderThreshold: true } } },
    });

    return levels.filter((sl) => {
      const threshold = sl.variant.reorderThreshold ?? defaultThreshold;
      return sl.quantityOnHand <= threshold;
    }).length;
  }

  private buildRecentActivity(
    bindings: Array<{
      distributorId: string;
      bindableType: string;
      boundAt: Date;
      distributor: { id: string; name: string };
    }>,
    commissions: Array<{
      orderId: string | null;
      distributorId: string;
      amount: { toString(): string };
      createdAt: Date;
      distributor: { id: string; name: string };
    }>,
    orders: Array<{
      id: string;
      total: { toString(): string };
      distributorId: string | null;
      createdAt: Date;
      distributor: { id: string; name: string } | null;
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
        orderId: entry.orderId ?? undefined,
        amount: entry.amount.toString(),
      }),
    );

    const orderEvents: MerchantDashboardActivity[] = orders
      .filter((order) => order.distributor)
      .map((order) => ({
        type: 'order.paid',
        occurredAt: order.createdAt.toISOString(),
        distributorId: order.distributorId!,
        distributorName: order.distributor!.name,
        orderId: order.id,
        amount: order.total.toString(),
      }));

    return [...bindingEvents, ...commissionEvents, ...orderEvents].sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }
}
