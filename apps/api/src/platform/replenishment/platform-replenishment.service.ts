import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReplenishmentRequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAllocationsService } from '../allocations/platform-allocations.service';

/**
 * 平台补货服务 - 处理商户补货请求审批
 *
 * 功能范围：
 * - 查询补货请求列表
 * - 批准补货请求（自动创建配额分配并发放）
 * - 拒绝补货请求
 *
 * 补货审批流程：
 * 1. 商户提交补货请求（分店发起）
 * 2. 平台管理员审核
 * 3. 批准后自动创建配额分配并发放给商户
 */
@Injectable()
export class PlatformReplenishmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly allocationsService: PlatformAllocationsService,
  ) {}

  /**
   * 查询补货请求列表
   *
   * @param status - 可选，按状态筛选
   * @returns 补货请求列表（包含关联的商户和商品明细）
   */
  async list(status?: ReplenishmentRequestStatus) {
    return this.prisma.replenishmentRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        tenant: { include: { merchantProfile: true } },
        lines: { include: { masterSku: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 批准补货请求
   *
   * 批准后自动执行：
   * 1. 为商户创建配额分配单
   * 2. 将配额分配单发放给商户（状态变为 CONFIRMED）
   * 3. 更新补货请求状态为 APPROVED
   *
   * @param id - 补货请求 ID
   * @param platformUserId - 平台审批人 ID
   * @returns 更新后的补货请求（含关联数据）
   * @throws NotFoundException - 请求不存在
   * @throws BadRequestException - 请求状态非待处理
   */
  async approve(id: string, platformUserId: string) {
    const req = await this.prisma.replenishmentRequest.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!req) throw new NotFoundException('Replenishment request not found');
    if (req.status !== ReplenishmentRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    const allocation = await this.allocationsService.createAllocation(
      req.tenantId,
      req.lines.map((l) => ({
        masterSkuId: l.masterSkuId,
        quantity: l.quantity,
      })),
      req.note ? `From replenishment ${req.id}: ${req.note}` : `From replenishment ${req.id}`,
    );

    await this.allocationsService.issueAllocation(allocation.id, platformUserId);

    return this.prisma.replenishmentRequest.update({
      where: { id },
      data: {
        status: ReplenishmentRequestStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedByPlatformUserId: platformUserId,
      },
      include: {
        tenant: { include: { merchantProfile: true } },
        lines: { include: { masterSku: true } },
      },
    });
  }

  /**
   * 拒绝补货请求
   *
   * @param id - 补货请求 ID
   * @param platformUserId - 平台审批人 ID
   * @param reason - 拒绝原因
   * @returns 更新后的补货请求
   * @throws NotFoundException - 请求不存在
   * @throws BadRequestException - 请求状态非待处理
   */
  async reject(id: string, platformUserId: string, reason: string) {
    const req = await this.prisma.replenishmentRequest.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException('Replenishment request not found');
    if (req.status !== ReplenishmentRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }
    return this.prisma.replenishmentRequest.update({
      where: { id },
      data: {
        status: ReplenishmentRequestStatus.REJECTED,
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedByPlatformUserId: platformUserId,
      },
    });
  }
}
