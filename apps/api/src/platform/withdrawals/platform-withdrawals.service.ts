import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerStatus, WithdrawalRequestStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformWithdrawalsService {
  constructor(private readonly prisma: PrismaService) {}

  
  async list(status?: WithdrawalRequestStatus) {
    return this.prisma.withdrawalRequest.findMany({
      where: status ? { status } : undefined,
      include: { distributor: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  
  async approve(id: string, platformUserId: string) {
    const req = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { distributor: true },
    });
    if (!req) throw new NotFoundException('Withdrawal not found');
    if (req.status !== WithdrawalRequestStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not pending');
    }
    const available = await this.getAvailableBalance(req.distributorId);
    if (available.lessThan(req.amount)) {
      throw new BadRequestException('Insufficient distributor balance');
    }
    return this.prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: WithdrawalRequestStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedByPlatformUserId: platformUserId,
      },
    });
  }

  
  async reject(id: string, platformUserId: string, reason: string) {
    const req = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Withdrawal not found');
    if (req.status !== WithdrawalRequestStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not pending');
    }
    return this.prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: WithdrawalRequestStatus.REJECTED,
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedByPlatformUserId: platformUserId,
      },
    });
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
