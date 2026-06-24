import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MerchantOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId },
      include: {
        lines: true,
        customer: { select: { id: true, email: true, firstName: true, lastName: true } },
        commissionEntry: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        lines: { include: { variant: true } },
        customer: { select: { id: true, email: true, firstName: true, lastName: true } },
        commissionEntry: true,
        distributor: { select: { id: true, name: true } },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
