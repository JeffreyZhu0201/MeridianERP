import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FulfillmentService } from '../../fulfillment/fulfillment.service';
import { PrismaService } from '../../prisma/prisma.service';

type DistributorRef = { id: string; name: string };

@Injectable()
export class PlatformOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  private resolveDistributor(order: {
    distributor: DistributorRef | null;
    commissionEntry: { distributor: DistributorRef } | null;
  }): DistributorRef | null {
    if (order.distributor) {
      return order.distributor;
    }
    return order.commissionEntry?.distributor ?? null;
  }

  async findAll(
    page = 1,
    limit = 20,
    status?: string,
    fulfillmentType?: string,
    guestEmail?: string,
    tenantId?: string,
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
          distributor: { select: { id: true, name: true } },
          commissionEntry: {
            include: { distributor: { select: { id: true, name: true } } },
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
        distributor: this.resolveDistributor(order),
      })),
      meta: { total, page, limit },
    };
  }

  
  async ship(orderId: string, platformUserId: string) {
    return this.fulfillmentService.shipDelivery(orderId, platformUserId);
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
        distributor: { select: { id: true, name: true } },
        commissionEntry: {
          include: { distributor: { select: { id: true, name: true } } },
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
      distributor: this.resolveDistributor(order),
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
