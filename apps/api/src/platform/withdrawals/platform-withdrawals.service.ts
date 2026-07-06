import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerStatus, WithdrawalRequestStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { WithdrawalListQuery } from '@meridian/shared';
import { PayoutService } from '../../payout/payout.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformWithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payoutService: PayoutService,
  ) {}

  private mapWithdrawalRow(row: {
    id: string;
    distributorId: string;
    amount: Prisma.Decimal;
    status: WithdrawalRequestStatus;
    note: string | null;
    rejectionReason: string | null;
    reviewedAt: Date | null;
    payoutProvider: string | null;
    payoutReference: string | null;
    disbursedAt: Date | null;
    payoutError: string | null;
    createdAt: Date;
    distributor: { name: string; email: string | null };
  }) {
    return {
      id: row.id,
      distributorId: row.distributorId,
      distributorName: row.distributor.name,
      distributorEmail: row.distributor.email,
      amount: row.amount.toString(),
      status: row.status,
      note: row.note,
      rejectionReason: row.rejectionReason,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      payoutProvider: row.payoutProvider,
      payoutReference: row.payoutReference,
      disbursedAt: row.disbursedAt?.toISOString() ?? null,
      payoutError: row.payoutError,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(query: WithdrawalListQuery = {}) {
    const where: Prisma.WithdrawalRequestWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.distributorId) where.distributorId = query.distributorId;

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where,
        include: { distributor: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);
    return {
      data: rows.map((row) => this.mapWithdrawalRow(row)),
      meta: { total, page, limit },
    };
  }

  async approve(id: string, platformUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.withdrawalRequest.findUnique({
        where: { id },
        include: { distributor: true },
      });
      if (!req) throw new NotFoundException('Withdrawal not found');
      if (req.status !== WithdrawalRequestStatus.PENDING) {
        throw new BadRequestException('Withdrawal is not pending');
      }

      const [settledAgg, approvedAgg, pendingAgg] = await Promise.all([
        tx.commissionLedger.aggregate({
          where: {
            distributorId: req.distributorId,
            status: LedgerStatus.SETTLED,
          },
          _sum: { amount: true },
        }),
        tx.withdrawalRequest.aggregate({
          where: {
            distributorId: req.distributorId,
            status: WithdrawalRequestStatus.APPROVED,
          },
          _sum: { amount: true },
        }),
        tx.withdrawalRequest.aggregate({
          where: {
            distributorId: req.distributorId,
            status: WithdrawalRequestStatus.PENDING,
          },
          _sum: { amount: true },
        }),
      ]);
      const settled = new Prisma.Decimal(settledAgg._sum.amount ?? 0);
      const withdrawn = new Prisma.Decimal(approvedAgg._sum.amount ?? 0);
      const pending = new Prisma.Decimal(pendingAgg._sum.amount ?? 0);
      const available = settled.minus(withdrawn).minus(pending);
      if (available.add(req.amount).lessThan(req.amount)) {
        throw new BadRequestException('Insufficient distributor balance');
      }

      const payout = await this.payoutService.disburse({
        withdrawalId: req.id,
        amount: req.amount.toString(),
        payeeEmail: req.distributor.email,
      });

      const updated = await tx.withdrawalRequest.update({
        where: { id, status: WithdrawalRequestStatus.PENDING },
        data: {
          status: WithdrawalRequestStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedByPlatformUserId: platformUserId,
          payoutProvider: payout.provider,
          payoutReference: payout.reference,
          disbursedAt: payout.disbursedAt,
          payoutError: null,
        },
        include: { distributor: { select: { name: true, email: true } } },
      });
      if (!updated) {
        throw new ConflictException('Withdrawal was already processed');
      }
      return this.mapWithdrawalRow(updated);
    });
  }

  async reject(id: string, platformUserId: string, reason: string) {
    const req = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException('Withdrawal not found');
    if (req.status !== WithdrawalRequestStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not pending');
    }
    const updated = await this.prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: WithdrawalRequestStatus.REJECTED,
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedByPlatformUserId: platformUserId,
      },
      include: { distributor: { select: { name: true, email: true } } },
    });
    return this.mapWithdrawalRow(updated);
  }

  async getAvailableBalance(distributorId: string): Promise<Prisma.Decimal> {
    const [settledAgg, approvedAgg, pendingAgg] = await Promise.all([
      this.prisma.commissionLedger.aggregate({
        where: { distributorId, status: LedgerStatus.SETTLED },
        _sum: { amount: true },
      }),
      this.prisma.withdrawalRequest.aggregate({
        where: { distributorId, status: WithdrawalRequestStatus.APPROVED },
        _sum: { amount: true },
      }),
      this.prisma.withdrawalRequest.aggregate({
        where: { distributorId, status: WithdrawalRequestStatus.PENDING },
        _sum: { amount: true },
      }),
    ]);
    const settled = new Prisma.Decimal(settledAgg._sum.amount ?? 0);
    const withdrawn = new Prisma.Decimal(approvedAgg._sum.amount ?? 0);
    const pending = new Prisma.Decimal(pendingAgg._sum.amount ?? 0);
    return settled.minus(withdrawn).minus(pending);
  }

  async createRequest(distributorId: string, amount: number, note?: string) {
    const pending = await this.prisma.withdrawalRequest.findFirst({
      where: { distributorId, status: WithdrawalRequestStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException('A pending withdrawal already exists');
    }
    const available = await this.getAvailableBalance(distributorId);
    const amt = new Prisma.Decimal(amount.toFixed(2));
    if (amt.lessThanOrEqualTo(0) || available.lessThan(amt)) {
      throw new BadRequestException('Insufficient available balance');
    }
    return this.prisma.withdrawalRequest.create({
      data: { distributorId, amount: amt, note },
    });
  }
}
