import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DeliveryAddress } from '@meridian/shared';
import { FulfillmentService } from '../../fulfillment/fulfillment.service';
import { PrismaService } from '../../prisma/prisma.service';

function mapOrder(order: {
  id: string;
  tenantId: string;
  status: string;
  fulfillmentType: string;
  pickupVerifiedAt: Date | null;
  shippedAt: Date | null;
  currency: string;
  subtotal: { toString(): string } | number;
  tax: { toString(): string } | number;
  total: { toString(): string } | number;
  guestEmail: string | null;
  pickupCode: string | null;
  deliveryAddress: unknown;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  lines: Array<{
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: { toString(): string } | number;
    lineTotal: { toString(): string } | number;
  }>;
}) {
  return {
    id: order.id,
    tenantId: order.tenantId,
    status: order.status,
    fulfillmentType: order.fulfillmentType,
    pickupVerifiedAt: order.pickupVerifiedAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    currency: order.currency,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    guestEmail: order.guestEmail,
    pickupCode: order.pickupCode,
    deliveryAddress: (order.deliveryAddress as DeliveryAddress | null) ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: order.customer,
    lines: order.lines.map((line) => ({
      id: line.id,
      productName: line.productName,
      variantName: line.variantName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
  };
}

@Injectable()
export class MerchantOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  private async assertNotFlagship(tenantId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId },
      select: { isFlagship: true },
    });
    if (profile?.isFlagship) {
      throw new BadRequestException(
        'Flagship store orders are fulfilled in the admin portal',
      );
    }
  }

  async findAll(tenantId: string) {
    const orders = await this.prisma.order.findMany({
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
    return orders.map(mapOrder);
  }

  listPickupPending(tenantId: string) {
    return this.fulfillmentService.listPickupPending(tenantId).then((orders) =>
      orders.map(mapOrder),
    );
  }

  async listDeliveryPending(tenantId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId },
      select: { isFlagship: true },
    });
    if (profile?.isFlagship) {
      return [];
    }
    return this.fulfillmentService
      .listDeliveryPending(tenantId)
      .then((orders) => orders.map(mapOrder));
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

  async shipDelivery(tenantId: string, orderId: string, userId: string) {
    await this.assertNotFlagship(tenantId);
    return this.fulfillmentService.shipBranchDelivery(
      tenantId,
      orderId,
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
    return {
      ...mapOrder(order),
      lines: order.lines.map((line) => ({
        id: line.id,
        productName: line.productName,
        variantName: line.variantName,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        variant: line.variant
          ? {
              id: line.variant.id,
              sku: line.variant.sku,
              name: line.variant.name,
              price: line.variant.price,
            }
          : null,
      })),
      commissionEntry: order.commissionEntry,
    };
  }
}
