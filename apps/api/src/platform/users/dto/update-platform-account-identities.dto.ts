import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import type { UpdatePlatformAccountIdentitiesRequest } from '@meridian/shared';

class DistributorIdentityDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate?: number;
}

class MerchantStaffAssignmentDto {
  @IsString()
  tenantId!: string;

  @IsBoolean()
  enabled!: boolean;
}

export class UpdatePlatformAccountIdentitiesDto
  implements UpdatePlatformAccountIdentitiesRequest
{
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn(['SUPER_ADMIN', 'FINANCE', 'FULFILLMENT', 'REVIEWER'])
  platformAdminRole?: 'SUPER_ADMIN' | 'FINANCE' | 'FULFILLMENT' | 'REVIEWER' | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @ValidateNested()
  @Type(() => DistributorIdentityDto)
  distributor?: DistributorIdentityDto | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MerchantStaffAssignmentDto)
  merchantStaff?: MerchantStaffAssignmentDto[];
}
