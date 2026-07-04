import { Injectable } from '@nestjs/common';
import { LedgerStatus, SettlementBatchStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportSettlementDto } from './dto/settlement.dto';

@Injectable()
export class PlatformSettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.settlementBatch.findMany({
        skip,
        take: limit,
        include: {
          _count: { select: { entries: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.settlementBatch.count(),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async findLedger(status?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as LedgerStatus } : {};
    const [data, total] = await Promise.all([
      this.prisma.commissionLedger.findMany({
        where,
        skip,
        take: limit,
        include: {
          distributor: { select: { id: true, name: true } },
          order: { select: { id: true, total: true } },
          tenant: { select: { id: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commissionLedger.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async exportBatch(dto: ExportSettlementDto) {
    const periodEnd = dto.periodEnd ? new Date(dto.periodEnd) : new Date();
    const periodStart = dto.periodStart
      ? new Date(dto.periodStart)
      : new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

    const entries = await this.prisma.commissionLedger.findMany({
      where: {
        status: LedgerStatus.ACCRUED,
        createdAt: { gte: periodStart, lte: periodEnd },
        settlementBatchId: null,
      },
      include: {
        distributor: true,
        order: true,
        tenant: { select: { id: true, slug: true } },
      },
    });

    const batch = await this.prisma.settlementBatch.create({
      data: {
        periodStart,
        periodEnd,
        status: SettlementBatchStatus.EXPORTED,
        exportedAt: new Date(),
      },
    });

    if (entries.length > 0) {
      await this.prisma.commissionLedger.updateMany({
        where: { id: { in: entries.map((e) => e.id) } },
        data: {
          settlementBatchId: batch.id,
          status: LedgerStatus.SETTLED,
          settledAt: new Date(),
        },
      });
    }

    return this.prisma.settlementBatch.findUniqueOrThrow({
      where: { id: batch.id },
      include: {
        entries: {
          include: {
            distributor: { select: { id: true, name: true } },
            order: { select: { id: true, total: true } },
            tenant: { select: { id: true, slug: true } },
          },
        },
      },
    });
  }
}
