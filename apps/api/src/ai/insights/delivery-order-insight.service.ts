import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AdminAiInsight, DeliveryOrderInsightRequest } from '@meridian/shared';
import { AiLlmService } from '../llm/ai-llm.service';
import type { AdminInsightContext } from '../llm/admin-insight.types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliveryOrderInsightService {
  private readonly logger = new Logger(DeliveryOrderInsightService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiLlm: AiLlmService,
  ) {}

  async insight(body: DeliveryOrderInsightRequest): Promise<AdminAiInsight> {
    const orderId = body.orderId?.trim();
    if (!orderId) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: { select: { slug: true, name: true } },
        lines: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const context: AdminInsightContext = {
      scene: 'delivery-order',
      data: {
        orderId: order.id,
        status: order.status,
        fulfillmentType: order.fulfillmentType,
        total: order.total.toString(),
        currency: order.currency,
        tenantSlug: order.tenant.slug,
        tenantName: order.tenant.name,
        guestEmail: order.guestEmail,
        lineCount: order.lines.length,
        createdAt: order.createdAt.toISOString(),
      },
    };

    this.logger.log(`Delivery order insight id=${orderId}`);
    return this.aiLlm.suggestAdminInsight(context);
  }
}
