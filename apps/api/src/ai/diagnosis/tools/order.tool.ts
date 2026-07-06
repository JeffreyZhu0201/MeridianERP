import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DiagnosisTool, type ToolResult } from './base.tool';

@Injectable()
export class OrderDiagnosisTool extends DiagnosisTool {
  readonly domain = 'order' as const;
  readonly name = 'order_query';

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const orderId = typeof args.orderId === 'string' ? args.orderId : undefined;
    const tenantId = typeof args.tenantId === 'string' ? args.tenantId : undefined;

    if (!orderId && !tenantId) {
      return this.notFound('orderId or tenantId');
    }

    const order = orderId
      ? await this.prisma.order.findUnique({
          where: { id: orderId },
          include: {
            tenant: { select: { slug: true, name: true } },
            lines: true,
          },
        })
      : await this.prisma.order.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          include: {
            tenant: { select: { slug: true, name: true } },
            lines: true,
          },
        });

    if (!order) {
      return this.notFound(orderId ?? tenantId ?? 'order');
    }

    return {
      found: true,
      summary: `订单 ${order.id} 状态 ${order.status}，履约 ${order.fulfillmentType}`,
      data: {
        id: order.id,
        status: order.status,
        fulfillmentType: order.fulfillmentType,
        total: order.total.toString(),
        tenantSlug: order.tenant.slug,
        tenantName: order.tenant.name,
        lineCount: order.lines.length,
        pickupVerifiedAt: order.pickupVerifiedAt?.toISOString() ?? null,
        shippedAt: order.shippedAt?.toISOString() ?? null,
      },
    };
  }
}
