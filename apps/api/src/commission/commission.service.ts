import { Injectable } from '@nestjs/common';
import { CommissionType, OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionQueueService } from '../queue/commission-queue.service';

@Injectable()
export class CommissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionQueue: CommissionQueueService,
  ) {}

  async accrueOnPaid(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { commissionEntry: true },
    });
    if (!order || order.status !== OrderStatus.PAID || !order.distributorId) {
      return;
    }
    if (order.commissionEntry) {
      return;
    }

    const distributor = await this.prisma.distributor.findFirst({
      where: { id: order.distributorId, tenantId: order.tenantId, isActive: true },
    });
    if (!distributor) {
      return;
    }

    const amount = this.calculateAmount(
      Number(order.total),
      Number(distributor.commissionRate),
      distributor.commissionType,
    );

    await this.prisma.commissionLedger.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        distributorId: distributor.id,
        amount,
        status: 'ACCRUED',
      },
    });

    await this.commissionQueue.enqueueAccrual(order.id);
  }

  calculateAmount(
    orderTotal: number,
    commissionRate: number,
    commissionType: CommissionType,
  ): Prisma.Decimal {
    const value =
      commissionType === CommissionType.PERCENT
        ? orderTotal * (commissionRate / 100)
        : commissionRate;
    return new Prisma.Decimal(value.toFixed(2));
  }
}
