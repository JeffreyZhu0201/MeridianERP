import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested, ArrayMinSize, IsIn, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus, StockAdjustmentReason } from '@prisma/client';

/**
 * 库存管理 DTO 定义
 *
 * 【设置相关】
 * UpdateInventorySettingsDto - 更新库存设置
 * - defaultReorderThreshold: 默认重订货阈值
 *
 * 【仓库相关】
 * CreateWarehouseDto - 创建仓库
 * - name: 仓库名称
 * - address: 仓库地址（可选）
 * - isDefault: 是否默认仓库（可选）
 *
 * UpdateWarehouseDto - 更新仓库
 * - name: 仓库名称（可选）
 * - address: 仓库地址（可选）
 * - isActive: 是否启用（可选）
 *
 * 【库存调整相关】
 * CreateStockAdjustmentDto - 创建库存调整
 * - warehouseId: 仓库ID
 * - variantId: 商品变体ID
 * - quantityDelta: 库存变化量（正数为增加，负数为减少）
 * - reason: 调整原因（StockAdjustmentReason 枚举）
 * - note: 备注（可选）
 *
 * UpdateReorderThresholdDto - 更新重订货阈值
 * - reorderThreshold: 重订货阈值（可设为 null）
 *
 * 【采购订单相关】
 * CreatePurchaseOrderLineDto - 采购订单行
 * - variantId: 商品变体ID
 * - quantityOrdered: 订购数量
 *
 * CreatePurchaseOrderDto - 创建采购订单
 * - warehouseId: 目标仓库ID
 * - supplierName: 供应商名称
 * - status: 订单状态（DRAFT 或 ORDERED）
 * - lines: 采购订单行列表
 *
 * UpdatePurchaseOrderDto - 更新采购订单
 * - supplierName, warehouseId, lines（仅草稿状态可更新）
 *
 * ReceivePurchaseOrderLineDto - 采购入库行
 * - purchaseOrderLineId: 采购订单行ID
 * - quantityReceived: 本次收货数量
 *
 * ReceivePurchaseOrderDto - 采购入库
 * - note: 备注（可选）
 * - lines: 入库行列表
 *
 * 【调拨相关】
 * CreateStockTransferLineDto - 调拨单行
 * - variantId: 商品变体ID
 * - quantity: 调拨数量
 *
 * CreateStockTransferDto - 创建调拨单
 * - fromWarehouseId: 源仓库ID
 * - toWarehouseId: 目标仓库ID
 * - note: 备注（可选）
 * - lines: 调拨行列表
 *
 * 【查询 DTO】
 * ListQueryDto - 分页查询基类
 * - page: 页码
 * - limit: 每页数量
 *
 * StockLevelListQueryDto - 库存水平查询
 * - warehouseId, variantId, q: 筛选条件
 *
 * AdjustmentListQueryDto - 调整记录查询
 * - from, to, reason, warehouseId, variantId: 筛选条件
 *
 * PurchaseOrderListQueryDto - 采购订单查询
 * - status, warehouseId: 筛选条件
 *
 * StockTransferListQueryDto - 调拨单查询
 * - fromWarehouseId, toWarehouseId: 筛选条件
 */
export class UpdateInventorySettingsDto {
  @IsInt()
  @Min(0)
  defaultReorderThreshold!: number;
}

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  isDefault?: boolean;
}

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  isActive?: boolean;
}

export class CreateStockAdjustmentDto {
  @IsString()
  warehouseId!: string;

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
  @IsString()
  warehouseId!: string;

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

export class CreateStockTransferLineDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateStockTransferDto {
  @IsString()
  fromWarehouseId!: string;

  @IsString()
  toWarehouseId!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateStockTransferLineDto)
  @ArrayMinSize(1)
  lines!: CreateStockTransferLineDto[];
}

export class StockTransferListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  fromWarehouseId?: string;

  @IsOptional()
  @IsString()
  toWarehouseId?: string;
}
