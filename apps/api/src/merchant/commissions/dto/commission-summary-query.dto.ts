import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LedgerStatus } from '@prisma/client';

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
