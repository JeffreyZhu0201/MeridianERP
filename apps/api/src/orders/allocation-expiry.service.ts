import { Injectable } from '@nestjs/common';
import { AllocationOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AllocationExpiryService {
  constructor(private readonly prisma: PrismaService) {}

  async expireIssuedAllocations(maxAgeDays = 14): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    const stale = await this.prisma.allocationOrder.findMany({
      where: {
        status: AllocationOrderStatus.ISSUED,
        issuedAt: { lt: cutoff },
      },
      include: { lines: true },
      take: 50,
    });

    let expired = 0;
    for (const order of stale) {
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const line of order.lines) {
            await tx.masterSku.update({
              where: { id: line.masterSkuId },
              data: {
                quantityOnHand: { increment: line.quantity },
                cumulativeShippedQty: { decrement: line.quantity },
              },
            });
          }
          await tx.allocationOrder.update({
            where: { id: order.id, status: AllocationOrderStatus.ISSUED },
            data: { status: AllocationOrderStatus.CANCELLED },
          });
        });
        expired += 1;
      } catch {
        // skip concurrent updates
      }
    }
    return expired;
  }
}
