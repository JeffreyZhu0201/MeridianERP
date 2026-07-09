import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CrossStoreOrderListItem,
  DeliveryAddress,
  StoreOrderDetail,
  StoreOrderListItem,
} from '@meridian/shared';
import { FulfillmentType, OrderStatus } from '@prisma/client';
import { OrderStatus as SharedOrderStatus } from '@meridian/shared';
import { FulfillmentService } from '../../fulfillment/fulfillment.service';
import { OrderLifecycleService } from '../../orders/order-lifecycle.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreTenantService } from '../common/store-tenant.service';

@Injectable()
export class StoreOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
    private readonly fulfillmentService: FulfillmentService,
    private readonly orderLifecycle: OrderLifecycleService,
  ) {}

  async listForCustomer(
    slug: string,
    customerId: string,
  ): Promise<StoreOrderListItem[]> {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const orders = await this.prisma.order.findMany({
      where: { tenantId: tenant.id, customerId },
      include: { _count: { select: { lines: true } } }, // 统计订单商品数量
      orderBy: { createdAt: 'desc' }, // 最新订单在前
    });
    return orders.map((order) => ({
      id: order.id,
      status: order.status as SharedOrderStatus,
      fulfillmentType: order.fulfillmentType,
      currency: order.currency,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      lineCount: order._count.lines,
    }));
  }

  async getForCustomer(
    slug: string,
    customerId: string,
    orderId: string,
  ): Promise<StoreOrderDetail> {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId: tenant.id, customerId },
      include: { lines: true }, // 包含商品明细
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return {
      id: order.id,
      status: order.status as SharedOrderStatus,
      fulfillmentType: order.fulfillmentType,
      currency: order.currency,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      pickupCode:
        order.fulfillmentType === FulfillmentType.PICKUP &&
        !order.pickupVerifiedAt
          ? order.pickupCode
          : null,
      pickupVerifiedAt: order.pickupVerifiedAt?.toISOString() ?? null,
      deliveryAddress: order.deliveryAddress as DeliveryAddress | null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      lineCount: order.lines.length,
      lines: order.lines.map((line) => ({
        id: line.id,
        productName: line.productName,
        variantName: line.variantName,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
        lineTotal: Number(line.lineTotal),
      })),
    };
  }

  async getPickupToken(slug: string, customerId: string, orderId: string) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId: tenant.id, customerId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.fulfillmentType !== FulfillmentType.PICKUP) {
      throw new BadRequestException('Order is not a pickup order');
    }
    if (order.pickupVerifiedAt) {
      throw new BadRequestException('Pickup already verified');
    }
    if (!order.pickupCode) {
      throw new BadRequestException('Pickup code not yet available');
    }
    return {
      orderId: order.id,
      pickupCode: order.pickupCode,
      qrPayload: this.fulfillmentService.buildPickupQrPayload(
        order.id,
        order.pickupCode,
      ),
    };
  }

  async cancelForCustomer(slug: string, customerId: string, orderId: string) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const order = await this.orderLifecycle.cancelPendingPayment({
      orderId,
      tenantId: tenant.id,
      customerId,
    });
    return { id: order.id, status: order.status };
  }

  async confirmDelivery(slug: string, customerId: string, orderId: string) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId: tenant.id, customerId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.fulfillmentType !== FulfillmentType.DELIVERY) {
      throw new BadRequestException('Only delivery orders can be confirmed');
    }
    if (order.status !== OrderStatus.FULFILLED) {
      throw new BadRequestException('Order has not been shipped yet');
    }
    if (order.deliveredAt) {
      throw new BadRequestException('Delivery already confirmed');
    }
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { deliveredAt: new Date() },
    });
    return {
      id: updated.id,
      status: updated.status,
      deliveredAt: updated.deliveredAt?.toISOString() ?? null,
    };
  }

  async listForAccount(accountId: string): Promise<CrossStoreOrderListItem[]> {
    const customers = await this.prisma.customer.findMany({
      where: { accountId },
      select: { id: true, tenantId: true },
    });
    if (customers.length === 0) {
      return [];
    }
    const customerIds = customers.map((c) => c.id);
    const orders = await this.prisma.order.findMany({
      where: { customerId: { in: customerIds } },
      include: {
        _count: { select: { lines: true } },
        tenant: {
          select: {
            slug: true,
            merchantProfile: { select: { businessName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => ({
      id: order.id,
      status: order.status as SharedOrderStatus,
      fulfillmentType: order.fulfillmentType,
      currency: order.currency,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      lineCount: order._count.lines,
      storeSlug: order.tenant.slug,
      storeName:
        order.tenant.merchantProfile?.businessName ?? order.tenant.slug,
    }));
  }
}
