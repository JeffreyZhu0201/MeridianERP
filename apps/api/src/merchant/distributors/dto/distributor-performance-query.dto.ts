import { IsOptional, IsString } from 'class-validator';

/**
 * 经销商业绩查询 DTO
 *
 * DistributorPerformanceQueryDto - 经销商业绩统计查询
 * - from: 统计起始日期（可选，ISO 日期字符串）
 * - to: 统计结束日期（可选，ISO 日期字符串）
 */
export class DistributorPerformanceQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
