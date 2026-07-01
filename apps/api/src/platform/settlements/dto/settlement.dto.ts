import { IsDateString, IsOptional } from 'class-validator';

/**
 * 导出结算批次 DTO
 *
 * 用于指定导出结算批次的日期范围。
 * 如果不指定，默认导出近30天的数据。
 */
export class ExportSettlementDto {
  /** 结算周期起始日期（ISO 8601 格式） */
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  /** 结算周期结束日期（ISO 8601 格式） */
  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}
