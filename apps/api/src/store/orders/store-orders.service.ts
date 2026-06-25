import { Injectable, NotFoundException } from '@nestjs/common';
import type { StoreOrderDetail, StoreOrderListItem } from '@meridian/shared';
import { OrderStatus } from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreTenantService } from '../common/store-tenant.service';

@Injectable()
export class StoreOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
  ) {}

  async listForCustomer(
    slug: string,
    customerId: string,
  ): Promise<StoreOrderListItem[]> {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const orders = await this.prisma.order.findMany({
      where: { tenantId: tenant.id, customerId },
      include: { _count: { select: { lines: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => ({
      id: order.id,
      status: order.status as OrderStatus,
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
      include: { lines: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return {
      id: order.id,
      status: order.status as OrderStatus,
      currency: order.currency,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
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
}
