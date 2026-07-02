import { Injectable } from '@nestjs/common';
import { LedgerStatus, Prisma } from '@prisma/client';
import { parseDateRangeQuery } from '../../common/date-range';
import { createListResponse } from '../../common/list-response';
import { getPagination } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import {
  decimalSumToString,
  mapCommissionStatementRow,
} from './commission-mappers';
import { CommissionListQueryDto } from './dto/commission-list-query.dto';
import { CommissionSummaryQueryDto } from './dto/commission-summary-query.dto';

/**
 * 佣金账本服务 (CommissionsService)
 *
 * ========================================
 * 模块职责
 * ========================================
 * 本服务为商户提供佣金账本的查询功能，是商户了解其合作经销商佣金的唯一接口。
 *
 * ========================================
 * 核心功能
 * ========================================
 *
 * 1. 佣金记录列表查询 (list)
 *    - 支持分页（page、limit）
 *    - 支持按状态筛选（LedgerStatus）
 *    - 支持按经销商筛选（distributorId）
 *    - 支持日期范围筛选（from、to）
 *    - 按创建时间倒序排列
 *
 * 2. 佣金汇总统计 (summary)
 *    - 计算时间范围内的佣金累计
 *    - 分别统计 ACCRUED（应计）和 SETTLED（已结算）金额
 *    - 返回总记录数（entryCount）
 *
 * ========================================
 * 佣金状态流转
 * ========================================
 *
 * ACCRUED（应计）
 *   ↓ 结算批次完成
 * SETTLED（已结算）
 *   ↓ 特殊情况（如退款）
 * VOID（作废）
 *
 * 默认查询排除 VOID 状态的记录。
 *
 * ========================================
 * 数据权限模型
 * ========================================
 *
 * 商户视角看到的是：哪些经销商为该商户带来了多少佣金
 *
 * 典型场景：
 * - 商户A 被 经销商X 招募
 * - 商户A 下单 → 订单完成 → 经销商X 获得佣金
 * - 商户A 在本接口查询：看到 经销商X 名下的佣金记录
 *
 * ========================================
 * 数据库查询优化
 * ========================================
 *
 * - 使用复合索引：tenantId + createdAt
 * - 汇总查询使用 aggregate 而非 findMany + reduce
 * - 分页限制最大 100 条/页
 *
 * ========================================
 * 注意事项
 * ========================================
 *
 * - 本服务为只读服务，不涉及佣金计算/修改
 * - 金额返回为字符串（Decimal.toString()），前端需注意精度处理
 * - 日期范围默认解析逻辑由 parseDateRangeQuery() 提供
 *
 * @see CommissionLedger Prisma 模型
 * @see CommissionListQueryDto 查询参数定义
 */
@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const { skip, take, page, limit } = getPagination(query);
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

    return createListResponse(
      rows.map(mapCommissionStatementRow),
      total,
      page,
      limit,
    );
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
