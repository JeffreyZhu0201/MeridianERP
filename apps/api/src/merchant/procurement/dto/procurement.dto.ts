import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BranchPurchaseOrderStatus } from '@prisma/client';

export class BranchPurchaseOrderLineDto {
  @IsString()
  masterSkuId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateBranchPurchaseOrderDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  receivingAddressId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BranchPurchaseOrderLineDto)
  lines!: BranchPurchaseOrderLineDto[];
}

export class BranchPurchaseOrderListQueryDto {
  @IsOptional()
  @IsString()
  status?: BranchPurchaseOrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class PlatformBranchPurchaseOrderListQueryDto {
  @IsOptional()
  @IsString()
  status?: BranchPurchaseOrderStatus | 'ALL';

  @IsOptional()
  @IsString()
  tenantId?: string;
}
