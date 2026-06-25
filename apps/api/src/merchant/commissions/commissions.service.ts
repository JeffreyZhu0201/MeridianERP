import { Injectable } from '@nestjs/common';
import { LedgerStatus, Prisma } from '@prisma/client';
import { parseDateRangeQuery } from '../../common/date-range';
import { PrismaService } from '../../prisma/prisma.service';
import {
  decimalSumToString,
  mapCommissionStatementRow,
} from './commission-mappers';
import { CommissionListQueryDto } from './dto/commission-list-query.dto';
import { CommissionSummaryQueryDto } from './dto/commission-summary-query.dto';

@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

  private paginate(page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return {
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      page: safePage,
      limit: safeLimit,
    };
  }

  private buildLedgerWhere(
    tenantId: string,
    query: CommissionListQueryDto | CommissionSummaryQueryDto,
    range: { from: Date; to: Date },
  ): Prisma.CommissionLedgerWhereInput {
    const statusFilter = query.status
      ? { status: query.status }
      : { status: { not: LedgerStatus.VOID } };

    return {
      tenantId,
      createdAt: { gte: range.from, lte: range.to },
      ...(query.distributorId ? { distributorId: query.distributorId } : {}),
      ...statusFilter,
    };
  }

  async list(tenantId: string, query: CommissionListQueryDto) {
    const range = parseDateRangeQuery(query);
    const { skip, take, page, limit } = this.paginate(query.page, query.limit);
    const where = this.buildLedgerWhere(tenantId, query, range);

    const [rows, total] = await Promise.all([
      this.prisma.commissionLedger.findMany({
        where,
        include: {
          order: { select: { total: true } },
          distributor: {
            select: {
              id: true,
              name: true,
              commissionType: true,
              commissionRate: true,
            },
          },
          settlementBatch: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.commissionLedger.count({ where }),
    ]);

    return {
      items: rows.map(mapCommissionStatementRow),
      total,
      page,
      limit,
    };
  }

  async summary(tenantId: string, query: CommissionSummaryQueryDto) {
    const range = parseDateRangeQuery(query);
    const baseWhere = this.buildLedgerWhere(tenantId, query, range);

    const [accrued, settled, entryCount] = await Promise.all([
      this.prisma.commissionLedger.aggregate({
        where: { ...baseWhere, status: LedgerStatus.ACCRUED },
        _sum: { amount: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: { ...baseWhere, status: LedgerStatus.SETTLED },
        _sum: { amount: true },
      }),
      this.prisma.commissionLedger.count({ where: baseWhere }),
    ]);

    const accruedTotal = decimalSumToString(accrued._sum.amount);
    const settledTotal = decimalSumToString(settled._sum.amount);
    const totalCommission = new Prisma.Decimal(accruedTotal)
      .plus(settledTotal)
      .toString();

    return {
      accruedTotal,
      settledTotal,
      totalCommission,
      entryCount,
      from: range.fromIso,
      to: range.toIso,
    };
  }
}
