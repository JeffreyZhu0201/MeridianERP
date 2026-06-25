import { IsOptional, IsString } from 'class-validator';

export class DistributorPerformanceQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
