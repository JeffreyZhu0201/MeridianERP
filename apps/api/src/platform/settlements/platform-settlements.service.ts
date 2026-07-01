import { Injectable } from '@nestjs/common';
import { LedgerStatus, SettlementBatchStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportSettlementDto } from './dto/settlement.dto';

/**
 * 平台结算服务 - 处理经销商佣金结算和账本查询
 *
 * 功能范围：
 * - 查询结算批次列表
 * - 查询佣金账本（按状态筛选）
 * - 导出结算批次（将应计佣金转为已结算）
 *
 * 佣金结算流程：
 * 1. 订单完成后，佣金应计到账本（ACCRUED）
 * 2. 平台管理员定期导出结算批次（EXPORTED）
 * 3. 实际打款后，账本条目状态更新为 SETTLED
 */
@Injectable()
export class PlatformSettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 分页查询结算批次列表
   *
   * 结算批次是佣金结算的基本单位，每个批次包含一段时期的佣金条目。
   *
   * @param page - 页码（默认1）
   * @param limit - 每页数量（默认20）
   * @returns 结算批次分页列表
   */
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

  /**
   * 分页查询佣金账本
   *
   * 佣金账本记录每个经销商的佣金收支明细。
   * 可按状态筛选（ACCRUED/SETTLED 等）。
   *
   * @param status - 可选，账本状态筛选
   * @param page - 页码（默认1）
   * @param limit - 每页数量（默认50）
   * @returns 佣金账目分页列表
   */
  async findLedger(status?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as LedgerStatus } : {};
    const [data, total] = await Promise.all([
      this.prisma.commissionLedger.findMany({
        where,
        skip,
        take: limit,
        include: {
          distributor: { select: { name: true } },
          order: { select: { id: true, total: true } },
          tenant: { select: { slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commissionLedger.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  /**
   * 导出结算批次
   *
   * 将指定时间范围内的应计佣金（ACCRUED）导出为一个结算批次。
   * 导出后，这些佣金条目的状态会变为 SETTLED。
   *
   * 结算逻辑：
   * 1. 查找时间范围内所有未结算的应计佣金
   * 2. 创建新的结算批次
   * 3. 将相关佣金条目关联到该批次并更新状态
   *
   * @param dto - 导出参数，包含 periodStart 和 periodEnd（可选，默认近30天）
   * @returns 创建的结算批次详情
   */
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
        data: { settlementBatchId: batch.id, status: LedgerStatus.SETTLED, settledAt: new Date() },
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
