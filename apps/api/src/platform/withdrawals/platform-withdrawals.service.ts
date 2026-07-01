import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerStatus, WithdrawalRequestStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 平台提现服务 - 处理经销商提现申请审批
 *
 * 功能范围：
 * - 查询提现申请列表
 * - 审批提现申请
 * - 拒绝提现申请
 * - 计算经销商可用余额
 * - 创建提现申请（内部调用）
 *
 * 提现流程：
 * 1. 经销商发起提现申请（待处理状态）
 * 2. 平台管理员审核（批准/拒绝）
 * 3. 批准后，经销商收到款项
 */
@Injectable()
export class PlatformWithdrawalsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 查询提现申请列表
   *
   * @param status - 可选，按状态筛选
   * @returns 提现申请列表（包含关联的经销商信息）
   */
  async list(status?: WithdrawalRequestStatus) {
    return this.prisma.withdrawalRequest.findMany({
      where: status ? { status } : undefined,
      include: { distributor: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 批准提现申请
   *
   * 审批前校验：
   * 1. 提现申请必须存在
   * 2. 状态必须为 PENDING
   * 3. 经销商可用余额必须充足
   *
   * 可用余额计算：已结算佣金 - 已批准提现 - 待处理提现
   *
   * @param id - 提现申请 ID
   * @param platformUserId - 平台审批人 ID
   * @returns 更新后的提现申请
   * @throws NotFoundException - 申请不存在
   * @throws BadRequestException - 状态非待处理或余额不足
   */
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

  /**
   * 拒绝提现申请
   *
   * @param id - 提现申请 ID
   * @param platformUserId - 平台审批人 ID
   * @param reason - 拒绝原因（必填）
   * @returns 更新后的提现申请
   * @throws NotFoundException - 申请不存在
   * @throws BadRequestException - 状态非待处理
   */
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

  /**
   * 计算经销商可用余额
   *
   * 可用余额 = 已结算佣金 - 已批准提现 - 待处理提现
   *
   * @param distributorId - 经销商 ID
   * @returns 可用余额（Prisma.Decimal 格式）
   */
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

  /**
   * 创建提现申请（内部调用）
   *
   * 创建前校验：
   * 1. 不存在待处理的提现申请（防止重复申请）
   * 2. 申请金额必须为正数
   * 3. 可用余额必须充足
   *
   * @param distributorId - 经销商 ID
   * @param amount - 提现金额
   * @param note - 备注（可选）
   * @returns 创建的提现申请
   * @throws ConflictException - 存在待处理申请
   * @throws BadRequestException - 金额非法或余额不足
   */
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
