import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { LedgerStatus } from '@prisma/client';

/**
 * 佣金记录列表查询 DTO (CommissionListQueryDto)
 *
 * ========================================
 * 用途
 * ========================================
 * 用于 GET /merchant/commissions 接口的查询参数。
 *
 * ========================================
 * 字段说明
 * ========================================
 *
 * @property page - 页码，从 1 开始，默认 1
 * @property limit - 每页记录数，默认 20，最大 100
 * @property distributorId - 筛选特定经销商的佣金记录（可选）
 * @property status - 筛选佣金状态（可选），见 LedgerStatus 枚举：
 *   - ACCRUED：应计/预提状态
 *   - SETTLED：已结算状态
 *   - VOID：已作废（默认不显示）
 * @property from - 日期范围起始（ISO 日期字符串），可选
 * @property to - 日期范围结束（ISO 日期字符串），可选
 *
 * ========================================
 * 验证规则
 * ========================================
 * - page >= 1
 * - limit >= 1 && <= 100
 * - status 必须是有效的 LedgerStatus 枚举值
 * - from/to 应为有效 ISO 日期格式
 *
 * ========================================
 * 日期范围行为
 * ========================================
 * - 若只提供 from：从该日期至今
 * - 若只提供 to：截至该日期
 * - 若都不提供：返回所有记录（可能很大）
 * - 日期比较基于 createdAt 字段
 *
 * @example
 * // 查询第 2 页，每页 50 条
 * GET /merchant/commissions?page=2&limit=50
 *
 * @example
 * // 查询 2024 年 1 月的已结算佣金
 * GET /merchant/commissions?status=SETTLED&from=2024-01-01&to=2024-01-31
 */
export class CommissionListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

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
