import { Injectable, Logger } from '@nestjs/common';
import { LedgerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_ACCRUED_REMINDER_DAYS = 30;

@Injectable()
export class SettlementReminderService {
  private readonly logger = new Logger(SettlementReminderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async remindStaleAccruedCommissions(
    maxAgeDays = DEFAULT_ACCRUED_REMINDER_DAYS,
  ): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    const stale = await this.prisma.commissionLedger.findMany({
      where: {
        status: LedgerStatus.ACCRUED,
        settlementBatchId: null,
        createdAt: { lt: cutoff },
      },
      select: { id: true, distributorId: true, amount: true },
      take: 100,
    });

    if (stale.length > 0) {
      this.logger.warn(
        `Settlement reminder: ${stale.length} accrued commission(s) older than ${maxAgeDays} days awaiting batch export`,
      );
    }
    return stale.length;
  }
}
