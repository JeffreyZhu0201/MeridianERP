import { BadRequestException, Injectable } from '@nestjs/common';
import { CommissionSource, LedgerStatus, Prisma } from '@prisma/client';
import { sumAllocationLineCost } from '@meridian/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EmailQueueService } from '../queue/email-queue.service';

@Injectable()
export class CommissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  async accrueOnAllocationConfirmed(allocationOrderId: string): Promise<void> {
    const allocation = await this.prisma.allocationOrder.findUnique({
      where: { id: allocationOrderId },
      include: { lines: true, commissionEntry: true },
    });
    if (!allocation || allocation.status !== 'CONFIRMED') {
      return;
    }
    if (allocation.commissionEntry) {
      return;
    }

    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId: allocation.tenantId },
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

    const priorCount = await this.prisma.commissionLedger.count({
      where: {
        tenantId: allocation.tenantId,
        commissionSource: CommissionSource.ALLOCATION,
        status: { not: LedgerStatus.VOID },
      },
    });
    if (priorCount >= 2) {
      return;
    }

    const wholesaleTotal = sumAllocationLineCost(
      allocation.lines.map((l) => ({
        quantity: l.quantity,
        wholesalePrice: Number(l.wholesalePrice),
      })),
    );
    const amount = this.calculateAmount(
      wholesaleTotal,
      Number(distributor.commissionRate),
      distributor.commissionType,
    );

    await this.prisma.commissionLedger.create({
      data: {
        tenantId: allocation.tenantId,
        allocationOrderId: allocation.id,
        distributorId: distributor.id,
        merchantAllocationSequence: priorCount + 1,
        commissionSource: CommissionSource.ALLOCATION,
        amount,
        status: LedgerStatus.ACCRUED,
      },
    });

    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId: allocation.tenantId },
    });
    if (settings?.notifyOnCommission !== false) {
      await this.emailQueue.sendCommissionAccrued({
        tenantId: allocation.tenantId,
        orderId: allocationOrderId,
        distributorId: distributor.id,
        amount: amount.toString(),
      });
    }
  }

  async voidOnRefund(orderId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const ledger = await client.commissionLedger.findUnique({ where: { orderId } });
    if (!ledger || ledger.status === LedgerStatus.VOID) {
      return;
    }
    if (ledger.status === LedgerStatus.SETTLED) {
      throw new BadRequestException(
        'Cannot refund order with settled commission; contact finance',
      );
    }
    await client.commissionLedger.update({
      where: { id: ledger.id },
      data: { status: LedgerStatus.VOID },
    });
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
