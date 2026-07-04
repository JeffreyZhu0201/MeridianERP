import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import type { CrmStoreCustomerListItem } from '@meridian/shared';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class StoreCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<CrmStoreCustomerListItem[]> {
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        orders: { some: { status: OrderStatus.FULFILLED } },
      },
      include: {
        orders: {
          where: { status: OrderStatus.FULFILLED },
          select: { total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return customers.map((customer) => {
      const completedOrderCount = customer.orders.length;
      const totalSpent = customer.orders.reduce(
        (sum, order) => sum + Number(order.total),
        0,
      );
      const lastOrderAt = customer.orders[0]?.createdAt.toISOString() ?? '';

      return {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        completedOrderCount,
        totalSpent,
        lastOrderAt,
      };
    });
  }
}
