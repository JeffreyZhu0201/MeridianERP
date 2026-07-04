import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsIn,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus, StockAdjustmentReason } from '@prisma/client';

export class UpdateInventorySettingsDto {
  @IsInt()
  @Min(0)
  defaultReorderThreshold!: number;
}

export class CreateStockAdjustmentDto {
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsString()
  variantId!: string;

  @IsInt()
  quantityDelta!: number;

  @IsEnum(StockAdjustmentReason)
  reason!: StockAdjustmentReason;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateReorderThresholdDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  reorderThreshold!: number | null;
}

export class CreatePurchaseOrderLineDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantityOrdered!: number;
}

export class CreatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsString()
  @IsNotEmpty()
  supplierName!: string;

  @IsIn(['DRAFT', 'ORDERED'])
  status!: 'DRAFT' | 'ORDERED';

  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderLineDto)
  @ArrayMinSize(1)
  lines!: CreatePurchaseOrderLineDto[];
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderLineDto)
  lines?: CreatePurchaseOrderLineDto[];
}

export class ReceivePurchaseOrderLineDto {
  @IsString()
  purchaseOrderLineId!: string;

  @IsInt()
  @Min(1)
  quantityReceived!: number;
}

export class ReceivePurchaseOrderDto {
  @IsOptional()
  @IsString()
  note?: string;

  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseOrderLineDto)
  @ArrayMinSize(1)
  lines!: ReceivePurchaseOrderLineDto[];
}

export class ListQueryDto {
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

export class StockLevelListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsString()
  q?: string;
}

export class AdjustmentListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsEnum(StockAdjustmentReason)
  reason?: StockAdjustmentReason;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  variantId?: string;
}

export class PurchaseOrderListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsString()
  warehouseId?: string;
}
