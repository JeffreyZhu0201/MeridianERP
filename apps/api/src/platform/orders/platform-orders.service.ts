import { Injectable } from '@nestjs/common';
import { FulfillmentType } from '@prisma/client';
import { FulfillmentService } from '../../fulfillment/fulfillment.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    status?: string,
    fulfillmentType?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (fulfillmentType) where.fulfillmentType = fulfillmentType;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          tenant: {
            select: {
              id: true,
              slug: true,
              merchantProfile: { select: { businessName: true } },
            },
          },
          lines: true,
          commissionEntry: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: data.map((order) => ({
        ...order,
        tenant: {
          id: order.tenant.id,
          slug: order.tenant.slug,
          businessName: order.tenant.merchantProfile?.businessName,
        },
      })),
      meta: { total, page, limit },
    };
  }

  async ship(orderId: string, platformUserId: string) {
    return this.fulfillmentService.shipDelivery(orderId, platformUserId);
  }
}
