import { Injectable, NotFoundException } from '@nestjs/common';
import { FulfillmentService } from '../../fulfillment/fulfillment.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MerchantOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  findAll(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId },
      include: {
        lines: true,
        customer: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        commissionEntry: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listPickupPending(tenantId: string) {
    return this.fulfillmentService.listPickupPending(tenantId);
  }

  verifyPickup(
    tenantId: string,
    orderId: string,
    code: string,
    userId: string,
  ) {
    return this.fulfillmentService.verifyPickup(
      tenantId,
      orderId,
      code,
      userId,
    );
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        lines: { include: { variant: true } },
        customer: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        commissionEntry: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
