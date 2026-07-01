import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LedgerStatus } from '@prisma/client';

/**
 * 佣金汇总查询 DTO (CommissionSummaryQueryDto)
 *
 * ========================================
 * 用途
 * ========================================
 * 用于 GET /merchant/commissions/summary 接口的查询参数。
 *
 * ========================================
 * 字段说明
 * ========================================
 *
 * @property distributorId - 筛选特定经销商的佣金汇总（可选）
 *   - 若不填：返回该商户所有经销商的汇总
 *   - 若填写：只返回该经销商带来的佣金汇总
 *
 * @property status - 佣金状态筛选（可选）
 *   - 主要用于调试，一般不填（见下面说明）
 *   - 注意：summary 默认查询会排除 VOID 状态
 *
 * @property from - 日期范围起始（可选）
 * @property to - 日期范围结束（可选）
 *
 * ========================================
 * 返回数据结构
 * ========================================
 * {
 *   accruedTotal: string,    // 应计佣金总额（字符串，Decimal）
 *   settledTotal: string,    // 已结算佣金总额
 *   totalCommission: string,  // 累计佣金总额（= accrued + settled）
 *   entryCount: number,     // 符合条件记录数
 *   from: string,           // 查询起始日期（ISO）
 *   to: string,             // 查询结束日期（ISO）
 * }
 *
 * ========================================
 * 与 List 的区别
 * ========================================
 * - List：返回每条佣金记录的明细
 * - Summary：返回聚合后的统计数据
 *
 * @example
 * // 查询 2024 年 Q1 佣金汇总
 * GET /merchant/commissions/summary?from=2024-01-01&to=2024-03-31
 *
 * @example
 * // 查看特定经销商的佣金汇总
 * GET /merchant/commissions/summary?distributorId=xxx
 */
export class CommissionSummaryQueryDto {
  @IsOptional()
  @IsString()
  distributorId?: string;

  @IsOptional()
  @IsEnum(LedgerStatus)
  status?: LedgerStatus;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
