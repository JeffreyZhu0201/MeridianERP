import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionQueueService } from '../queue/commission-queue.service';
import { EmailQueueService } from '../queue/email-queue.service';

@Injectable()
export class CommissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionQueue: CommissionQueueService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  /** @deprecated Phase 5 — commission accrues on FULFILLED, not PAID */
  async accrueOnPaid(_orderId: string): Promise<void> {
    return;
  }

  async accrueOnFulfilled(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { commissionEntry: true },
    });
    if (!order || order.status !== OrderStatus.FULFILLED) {
      return;
    }
    if (order.commissionEntry) {
      return;
    }

    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId: order.tenantId },
    });
    if (!profile?.recruitedByDistributorId) {
      return;
    }

    const distributor = await this.prisma.distributor.findFirst({
      where: {
        id: profile.recruitedByDistributorId,
        tenantId: null,
        isActive: true,
      },
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

    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId: order.tenantId },
    });
    if (settings?.notifyOnCommission !== false) {
      await this.emailQueue.sendCommissionAccrued({
        tenantId: order.tenantId,
        orderId: order.id,
        distributorId: distributor.id,
        amount: amount.toString(),
      });
    }
  }

  calculateAmount(
    orderTotal: number,
    commissionRate: number,
    commissionType: import('@prisma/client').CommissionType,
  ): Prisma.Decimal {
    const value =
      commissionType === 'PERCENT'
        ? orderTotal * (commissionRate / 100)
        : commissionRate;
    return new Prisma.Decimal(value.toFixed(2));
  }
}
