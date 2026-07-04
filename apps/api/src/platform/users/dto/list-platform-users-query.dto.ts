import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { UserIdentity } from '@meridian/shared';

export class ListPlatformUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum([
    'CONSUMER',
    'MERCHANT_OWNER',
    'MERCHANT_STAFF',
    'DISTRIBUTOR',
    'PLATFORM_ADMIN',
  ])
  identity?: UserIdentity;

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
}
