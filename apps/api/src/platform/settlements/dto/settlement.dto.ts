import { IsDateString, IsOptional } from 'class-validator';

export class ExportSettlementDto {
  @IsOptional()
  @IsDateString()
  periodStart?: string;
  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}
