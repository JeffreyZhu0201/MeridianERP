import { OnboardingStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 商户列表查询 DTO
 */
export class ListMerchantsQueryDto {
  /** 页码（默认1） */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** 每页数量（默认20，最大100） */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /** 按入驻状态筛选 */
  @IsOptional()
  @IsEnum(OnboardingStatus)
  status?: OnboardingStatus;

  /** 按商户名称或联系邮箱搜索 */
  @IsOptional()
  @IsString()
  search?: string;
}
