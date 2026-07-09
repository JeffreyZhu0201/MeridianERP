import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  AdminAiInsight,
  AiStreamEvent,
  DeliveryOrderInsightRequest,
} from '@meridian/shared';
import { AiLlmStreamService } from '../llm/ai-llm-stream.service';
import { AiLlmService } from '../llm/ai-llm.service';
import type { AdminInsightContext } from '../llm/admin-insight.types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliveryOrderInsightService {
  private readonly logger = new Logger(DeliveryOrderInsightService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiLlm: AiLlmService,
    private readonly aiLlmStream: AiLlmStreamService,
  ) {}

  async insight(body: DeliveryOrderInsightRequest): Promise<AdminAiInsight> {
    const context = await this.buildContext(body);
    this.logger.log(`Delivery order insight id=${body.orderId?.trim()}`);
    const { result } = await this.aiLlm.suggestAdminInsight(context, {
      actorType: 'PLATFORM',
    });
    return result;
  }

  async *insightStream(
    body: DeliveryOrderInsightRequest,
  ): AsyncGenerator<AiStreamEvent> {
    const context = await this.buildContext(body);
    this.logger.log(
      `Delivery order insight stream id=${body.orderId?.trim()}`,
    );
    yield* this.aiLlmStream.streamAdminInsight(
      'PLATFORM_DELIVERY_INSIGHT',
      context,
    );
  }

  private async buildContext(
    body: DeliveryOrderInsightRequest,
  ): Promise<AdminInsightContext> {
    const orderId = body.orderId?.trim();
    if (!orderId) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: {
          select: {
            slug: true,
            merchantProfile: { select: { businessName: true } },
          },
        },
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
        tenantName:
          order.tenant.merchantProfile?.businessName ?? order.tenant.slug,
        guestEmail: order.guestEmail,
        lineCount: order.lines.length,
        createdAt: order.createdAt.toISOString(),
      },
    };

    return context;
  }
}
