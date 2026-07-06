import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import {
  computeBranchNetPosition,
  pickupOrderGrossProfit,
  sumAllocationLineCost,
} from '@meridian/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { DiagnosisTool, type ToolResult } from './base.tool';

@Injectable()
export class FundDiagnosisTool extends DiagnosisTool {
  readonly domain = 'fund' as const;
  readonly name = 'fund_query';

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const tenantId = typeof args.tenantId === 'string' ? args.tenantId : undefined;

    if (!tenantId) {
      const overview = await this.prisma.order.aggregate({
        where: { status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] } },
        _sum: { total: true },
        _count: { _all: true },
      });
      return {
        found: true,
        summary: `平台已支付/完成订单 ${overview._count._all} 笔，GMV ${overview._sum.total ?? 0}`,
        data: {
          scope: 'platform',
          orderCount: overview._count._all,
          gmv: (overview._sum.total ?? 0).toString(),
        },
      };
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, name: true },
    });
    if (!tenant) {
      return this.notFound(tenantId);
    }

    const [pickupOrders, allocationLines, deliveryLedgers] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          tenantId,
          status: OrderStatus.FULFILLED,
          fulfillmentType: 'PICKUP',
        },
        include: { lines: true },
        take: 100,
      }),
      this.prisma.allocationOrderLine.findMany({
        where: {
          allocationOrder: { tenantId, status: 'CONFIRMED' },
        },
        select: { quantity: true, wholesalePrice: true },
      }),
      this.prisma.deliveryAllocationLedger.aggregate({
        where: { tenantId },
        _sum: { lineTotal: true },
      }),
    ]);

    const pickupProfit = pickupOrders.reduce(
      (sum, order) =>
        sum +
        pickupOrderGrossProfit(
          Number(order.total),
          order.lines.map((l) => ({
            quantity: l.quantity,
            unitWholesalePrice:
              l.unitWholesalePrice != null ? Number(l.unitWholesalePrice) : null,
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
      pickupGrossProfit: pickupProfit,
      allocationCost,
      deliveryCost,
    });

    return {
      found: true,
      summary: `分店 ${tenant.slug} 净头寸约 ${netPosition.toFixed(2)} CNY`,
      data: {
        tenantId,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        pickupGrossProfit: pickupProfit.toFixed(2),
        allocationCost: allocationCost.toFixed(2),
        deliveryCost: deliveryCost.toFixed(2),
        netPosition: netPosition.toFixed(2),
      },
    };
  }
}
