import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FulfillmentService } from '../../fulfillment/fulfillment.service';
import { OrderLifecycleService } from '../../orders/order-lifecycle.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fulfillmentService: FulfillmentService,
    private readonly orderLifecycle: OrderLifecycleService,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    status?: string,
    fulfillmentType?: string,
    guestEmail?: string,
    tenantId?: string,
    deliveryQueue?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status as Prisma.EnumOrderStatusFilter['equals'];
    if (fulfillmentType) {
      where.fulfillmentType =
        fulfillmentType as Prisma.EnumFulfillmentTypeFilter['equals'];
    }
    if (tenantId) where.tenantId = tenantId;
    if (guestEmail?.trim()) {
      where.guestEmail = { contains: guestEmail.trim(), mode: 'insensitive' };
    }
    if (deliveryQueue) {
      where.fulfillmentType = 'DELIVERY';
      where.status = 'PAID';
      where.shippedAt = null;
      where.tenant = { merchantProfile: { isFlagship: true } };
    }

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
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: data.map((order) => ({
        id: order.id,
        tenantId: order.tenantId,
        status: order.status,
        fulfillmentType: order.fulfillmentType,
        currency: order.currency,
        total: order.total,
        guestEmail: order.guestEmail,
        createdAt: order.createdAt.toISOString(),
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

  cancel(orderId: string) {
    return this.orderLifecycle.cancelPendingPayment({ orderId });
  }

  refund(orderId: string, allowFulfilled = false) {
    return this.orderLifecycle.refundPaidOrder({ orderId, allowFulfilled });
  }

  async findOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            merchantProfile: { select: { businessName: true } },
          },
        },
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            accountId: true,
          },
        },
        lines: { include: { variant: { select: { sku: true } } } },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return {
      id: order.id,
      tenantId: order.tenantId,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      currency: order.currency,
      total: order.total,
      guestEmail: order.guestEmail,
      deliveryAddress: order.deliveryAddress,
      pickupCode: order.pickupCode,
      pickupVerifiedAt: order.pickupVerifiedAt?.toISOString() ?? null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      tenant: {
        id: order.tenant.id,
        slug: order.tenant.slug,
        businessName: order.tenant.merchantProfile?.businessName ?? null,
      },
      customer: order.customer
        ? {
            id: order.customer.id,
            email: order.customer.email,
            firstName: order.customer.firstName,
            lastName: order.customer.lastName,
            accountId: order.customer.accountId,
          }
        : null,
      lines: order.lines.map((line) => ({
        id: line.id,
        productName: line.productName,
        variantName: line.variantName,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        unitWholesalePrice: line.unitWholesalePrice,
        lineTotal: line.lineTotal,
        skuCode: line.variant?.sku ?? null,
      })),
    };
  }
}
