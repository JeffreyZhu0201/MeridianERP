import type { PurchaseOrderStatus, StockAdjustmentReason, StockTransferStatus } from './enums.js';

/**
 * 租户库存配置接口
 * 每个租户（商户）对应一套独立的库存参数配置
 * @property tenantId - 所属租户ID
 * @property defaultReorderThreshold - 默认补货阈值，库存低于此值时触发预警
 * @property createdAt - 记录创建时间
 * @property updatedAt - 记录最后更新时间
 */
export interface TenantInventorySettings {
  tenantId: string;
  defaultReorderThreshold: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 更新租户库存配置请求
 * @property defaultReorderThreshold - 新的默认补货阈值
 */
export interface UpdateTenantInventorySettingsRequest {
  defaultReorderThreshold: number;
}

/**
 * 仓库接口
 * 描述商户的仓储地点信息
 * @property id - 仓库唯一标识
 * @property tenantId - 所属租户ID
 * @property name - 仓库名称
 * @property address - 仓库地址，可为空
 * @property isDefault - 是否为默认仓库（新建库存记录时默认选择）
 * @property isActive - 仓库是否启用
 * @property createdAt - 记录创建时间
 * @property updatedAt - 记录最后更新时间
 */
export interface Warehouse {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建仓库请求
 * @property name - 仓库名称（必填）
 * @property address - 仓库地址（可选）
 * @property isDefault - 是否设为默认仓库（可选，默认false）
 */
export interface CreateWarehouseRequest {
  name: string;
  address?: string;
  isDefault?: boolean;
}

/**
 * 更新仓库请求
 * @property name - 新的仓库名称（可选）
 * @property address - 新的仓库地址（可选，可传null清除）
 * @property isActive - 是否启用仓库（可选）
 */
export interface UpdateWarehouseRequest {
  name?: string;
  address?: string | null;
  isActive?: boolean;
}

/**
 * 库存余量接口
 * 记录特定仓库中某商品变体的当前库存数量
 * @property id - 库存记录唯一标识
 * @property tenantId - 所属租户ID
 * @property warehouseId - 所属仓库ID
 * @property variantId - 商品变体ID（如颜色/尺寸组合）
 * @property quantityOnHand - 当前在手库存数量
 * @property createdAt - 记录创建时间
 * @property updatedAt - 记录最后更新时间
 */
export interface StockLevel {
  id: string;
  tenantId: string;
  warehouseId: string;
  variantId: string;
  quantityOnHand: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 带明细的库存余量接口
 * 在基础库存余量上关联仓库和商品变体的详细信息
 * @property warehouse - 所属仓库的摘要信息（仅id、name、isDefault）
 * @property variant - 商品变体的完整信息，包括关联商品名称
 * @property variant.reorderThreshold - 该变体的补货阈值（可自定义）
 * @property variant.sellableInventory - 可销售库存数量（扣除预留/锁定数量后的实际可售数）
 */
export interface StockLevelWithDetails extends StockLevel {
  warehouse: Pick<Warehouse, 'id' | 'name' | 'isDefault'>;
  variant: {
    id: string;
    sku: string;
    name: string;
    productId: string;
    productName: string;
    reorderThreshold: number | null;
    sellableInventory: number;
  };
}

/**
 * 库存余量汇总项接口
 * 用于库存仪表盘展示，按商品维度汇总各仓库库存
 * @property variantId - 商品变体ID
 * @property sku - 商品SKU编码
 * @property variantName - 变体名称
 * @property productId - 所属商品ID
 * @property productName - 所属商品名称
 * @property sellableInventory - 可销售总库存
 * @property totalOnHand - 在手总库存（含预留/锁定）
 * @property byWarehouse - 按仓库分组的库存明细
 */
export interface StockLevelSummaryItem {
  variantId: string;
  sku: string;
  variantName: string;
  productId: string;
  productName: string;
  sellableInventory: number;
  totalOnHand: number;
  byWarehouse: Array<{
    warehouseId: string;
    warehouseName: string;
    quantityOnHand: number;
  }>;
}

/**
 * 创建库存调整请求
 * @property warehouseId - 目标仓库ID
 * @property variantId - 商品变体ID
 * @property quantityDelta - 库存变化量（正数为增加，负数为减少）
 * @property reason - 调整原因
 * @property note - 调整说明备注（可选）
 */
export interface CreateStockAdjustmentRequest {
  warehouseId: string;
  variantId: string;
  quantityDelta: number;
  reason: StockAdjustmentReason;
  note?: string;
}

/**
 * 库存调整记录接口
 * 记录每次库存变动的明细流水
 * @property id - 调整记录唯一标识
 * @property tenantId - 所属租户ID
 * @property warehouseId - 仓库ID
 * @property variantId - 商品变体ID
 * @property actorId - 操作人ID
 * @property reason - 调整原因类型
 * @property note - 调整说明
 * @property quantityDelta - 本次变化数量
 * @property quantityBefore - 调整前库存数
 * @property quantityAfter - 调整后库存数
 * @property createdAt - 调整时间
 */
export interface StockAdjustment {
  id: string;
  tenantId: string;
  warehouseId: string;
  variantId: string;
  actorId: string;
  reason: StockAdjustmentReason;
  note: string | null;
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;
  createdAt: string;
}

/**
 * 带明细的库存调整记录接口
 * 在基础调整记录上关联操作人和仓库信息
 * @property actor - 操作人信息（仅id和email）
 * @property warehouse - 仓库摘要信息
 * @property variant - 商品变体摘要信息及所属商品名称
 */
export interface StockAdjustmentWithDetails extends StockAdjustment {
  actor: { id: string; email: string };
  warehouse: Pick<Warehouse, 'id' | 'name'>;
  variant: { id: string; sku: string; name: string; productName: string };
}

/**
 * 低库存预警项接口
 * 库存低于阈值时触发预警，用于库存仪表盘提醒
 * @property variantId - 商品变体ID
 * @property sku - 商品SKU编码
 * @property variantName - 变体名称
 * @property productId - 所属商品ID
 * @property productName - 所属商品名称
 * @property warehouseId - 仓库ID
 * @property warehouseName - 仓库名称
 * @property quantityOnHand - 当前在手库存
 * @property reorderThreshold - 补货阈值
 */
export interface LowStockAlertItem {
  variantId: string;
  sku: string;
  variantName: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  reorderThreshold: number;
}

/**
 * 采购订单明细行接口
 * 采购订单中的单个商品项
 * @property id - 订单行唯一标识
 * @property purchaseOrderId - 所属采购订单ID
 * @property variantId - 商品变体ID
 * @property quantityOrdered - 订购数量
 * @property quantityReceived - 已收货数量
 * @property createdAt - 记录创建时间
 * @property updatedAt - 记录最后更新时间
 */
export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  variantId: string;
  quantityOrdered: number;
  quantityReceived: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 带变体明细的采购订单行接口
 * 包含商品变体的详细信息及剩余待收数量
 * @property variant - 变体摘要信息（id、sku、名称、所属商品名称）
 * @property quantityRemaining - 剩余待收货数量（订购数 - 已收数）
 */
export interface PurchaseOrderLineWithVariant extends PurchaseOrderLine {
  variant: { id: string; sku: string; name: string; productName: string };
  quantityRemaining: number;
}

/**
 * 采购订单接口
 * 向供应商采购商品的订单记录
 * @property id - 采购订单唯一标识
 * @property tenantId - 所属租户ID
 * @property warehouseId - 收货仓库ID
 * @property supplierName - 供应商名称
 * @property status - 订单状态
 * @property poNumber - 采购订单编号
 * @property createdById - 创建人ID
 * @property orderedAt - 正式下单时间（为null表示仍为草稿）
 * @property createdAt - 记录创建时间
 * @property updatedAt - 记录最后更新时间
 */
export interface PurchaseOrder {
  id: string;
  tenantId: string;
  warehouseId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  poNumber: string;
  createdById: string;
  orderedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建采购订单商品行请求
 * @property variantId - 商品变体ID
 * @property quantityOrdered - 订购数量
 */
export interface CreatePurchaseOrderLineRequest {
  variantId: string;
  quantityOrdered: number;
}

/**
 * 创建采购订单请求
 * @property warehouseId - 收货仓库ID
 * @property supplierName - 供应商名称
 * @property status - 初始状态（DRAFT或ORDERED）
 * @property lines - 订单商品明细列表
 */
export interface CreatePurchaseOrderRequest {
  warehouseId: string;
  supplierName: string;
  status: 'DRAFT' | 'ORDERED';
  lines: CreatePurchaseOrderLineRequest[];
}

/**
 * 更新采购订单请求
 * @property supplierName - 新的供应商名称（可选）
 * @property warehouseId - 更改收货仓库（可选）
 * @property lines - 更新商品明细（可选，全量替换）
 */
export interface UpdatePurchaseOrderRequest {
  supplierName?: string;
  warehouseId?: string;
  lines?: CreatePurchaseOrderLineRequest[];
}

/**
 * 采购收货单明细行接口
 * 记录一次收货操作中收到的商品明细
 * @property id - 收货行唯一标识
 * @property receiptId - 所属收货单ID
 * @property purchaseOrderLineId - 对应的采购订单行ID
 * @property quantityReceived - 本次收货数量
 */
export interface PurchaseOrderReceiptLine {
  id: string;
  receiptId: string;
  purchaseOrderLineId: string;
  quantityReceived: number;
}

/**
 * 采购收货单接口
 * 记录一次完整的收货操作
 * @property id - 收货单唯一标识
 * @property tenantId - 所属租户ID
 * @property purchaseOrderId - 对应采购订单ID
 * @property receivedById - 收货人ID
 * @property note - 收货备注说明
 * @property lines - 收货商品明细列表
 * @property createdAt - 收货时间
 */
export interface PurchaseOrderReceipt {
  id: string;
  tenantId: string;
  purchaseOrderId: string;
  receivedById: string;
  note: string | null;
  lines: PurchaseOrderReceiptLine[];
  createdAt: string;
}

/**
 * 采购收货商品行请求
 * @property purchaseOrderLineId - 目标采购订单行ID
 * @property quantityReceived - 本次收货数量
 */
export interface ReceivePurchaseOrderLineRequest {
  purchaseOrderLineId: string;
  quantityReceived: number;
}

/**
 * 采购收货操作请求
 * @property note - 收货备注（可选）
 * @property lines - 本次收货的各商品明细
 */
export interface ReceivePurchaseOrderRequest {
  note?: string;
  lines: ReceivePurchaseOrderLineRequest[];
}

/**
 * 带完整明细的采购订单接口
 * 包含订单所有相关信息用于详情页展示
 * @property warehouse - 收货仓库信息
 * @property createdBy - 创建人信息
 * @property lines - 订单商品明细列表
 * @property receipts - 所有收货记录列表
 */
export interface PurchaseOrderWithDetails extends PurchaseOrder {
  warehouse: Pick<Warehouse, 'id' | 'name'>;
  createdBy: { id: string; email: string };
  lines: PurchaseOrderLineWithVariant[];
  receipts: Array<
    PurchaseOrderReceipt & {
      receivedBy: { id: string; email: string };
      lines: Array<
        PurchaseOrderReceiptLine & {
          purchaseOrderLine: Pick<PurchaseOrderLine, 'id' | 'variantId'>;
        }
      >;
    }
  >;
}

/**
 * 更新商品变体补货阈值请求
 * @property reorderThreshold - 新的补货阈值（传null表示使用系统默认值）
 */
export interface UpdateVariantReorderThresholdRequest {
  reorderThreshold: number | null;
}

/**
 * 平台视角的租户库存汇总接口
 * 平台管理员查看某商户整体库存状况
 * @property tenantId - 租户ID
 * @property warehouseCount - 仓库数量
 * @property skuCount - SKU总种类数
 * @property totalUnitsOnHand - 手总库存件数
 * @property lowStockCount - 低库存预警商品数
 * @property warehouses - 各仓库的库存明细
 */
export interface PlatformTenantInventorySummary {
  tenantId: string;
  warehouseCount: number;
  skuCount: number;
  totalUnitsOnHand: number;
  lowStockCount: number;
  warehouses: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    skuCount: number;
    unitsOnHand: number;
  }>;
}

/**
 * 低库存检查任务负载
 * BullMQ 队列任务 Payload，用于触发低库存预警检测
 * @property tenantId - 租户ID（必填，检查整个租户）
 * @property variantId - 指定商品变体ID（可选，仅检查特定商品）
 * @property warehouseId - 指定仓库ID（可选，仅检查特定仓库）
 */
export interface LowStockCheckJobPayload {
  tenantId: string;
  variantId?: string;
  warehouseId?: string;
}

/**
 * 分页响应通用结构
 * 用于所有列表查询接口的标准化分页返回
 * @property items - 当前页数据列表
 * @property total - 总记录数
 * @property page - 当前页码（从1开始）
 * @property limit - 每页条数
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 库存余量查询参数
 * @property warehouseId - 按仓库筛选（可选）
 * @property variantId - 按商品变体筛选（可选）
 * @property q - 关键词搜索（匹配SKU或名称）
 * @property page - 页码（默认1）
 * @property limit - 每页条数（默认20）
 */
export interface StockLevelListQuery {
  warehouseId?: string;
  variantId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

/**
 * 库存调整记录查询参数
 * @property from - 起始日期（YYYY-MM-DD格式）
 * @property to - 结束日期
 * @property reason - 按调整原因筛选
 * @property warehouseId - 按仓库筛选
 * @property variantId - 按商品变体筛选
 * @property page - 页码
 * @property limit - 每页条数
 */
export interface AdjustmentListQuery {
  from?: string;
  to?: string;
  reason?: StockAdjustmentReason;
  warehouseId?: string;
  variantId?: string;
  page?: number;
  limit?: number;
}

/**
 * 采购订单查询参数
 * @property status - 按订单状态筛选
 * @property warehouseId - 按收货仓库筛选
 * @property page - 页码
 * @property limit - 每页条数
 */
export interface PurchaseOrderListQuery {
  status?: PurchaseOrderStatus;
  warehouseId?: string;
  page?: number;
  limit?: number;
}

/**
 * 库存调拨明细行接口
 * 调拨单中的单个商品项
 * @property id - 调拨行唯一标识
 * @property transferId - 所属调拨单ID
 * @property variantId - 商品变体ID
 * @property quantity - 调拨数量
 */
export interface StockTransferLine {
  id: string;
  transferId: string;
  variantId: string;
  quantity: number;
}

/**
 * 带变体明细的调拨行接口
 * @property variant - 商品变体摘要信息
 */
export interface StockTransferLineWithVariant extends StockTransferLine {
  variant: { id: string; sku: string; name: string; productName: string };
}

/**
 * 库存调拨单接口
 * 记录仓库间商品调拨业务
 * @property id - 调拨单唯一标识
 * @property tenantId - 所属租户ID
 * @property fromWarehouseId - 源仓库ID（调出仓库）
 * @property toWarehouseId - 目标仓库ID（调入仓库）
 * @property status - 调拨状态
 * @property note - 调拨备注说明
 * @property createdById - 创建人ID
 * @property createdAt - 创建时间
 */
export interface StockTransfer {
  id: string;
  tenantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: StockTransferStatus;
  note: string | null;
  createdById: string;
  createdAt: string;
}

/**
 * 调拨单商品行请求
 * @property variantId - 商品变体ID
 * @property quantity - 调拨数量
 */
export interface CreateStockTransferLineRequest {
  variantId: string;
  quantity: number;
}

/**
 * 创建库存调拨单请求
 * @property fromWarehouseId - 源仓库ID
 * @property toWarehouseId - 目标仓库ID
 * @property note - 调拨备注（可选）
 * @property lines - 调拨商品明细列表
 */
export interface CreateStockTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  note?: string;
  lines: CreateStockTransferLineRequest[];
}

/**
 * 带完整明细的库存调拨单接口
 * @property fromWarehouse - 源仓库信息
 * @property toWarehouse - 目标仓库信息
 * @property createdBy - 创建人信息
 * @property lines - 调拨商品明细列表
 */
export interface StockTransferWithDetails extends StockTransfer {
  fromWarehouse: Pick<Warehouse, 'id' | 'name'>;
  toWarehouse: Pick<Warehouse, 'id' | 'name'>;
  createdBy: { id: string; email: string };
  lines: StockTransferLineWithVariant[];
}

/**
 * 库存调拨单查询参数
 * @property fromWarehouseId - 按源仓库筛选
 * @property toWarehouseId - 按目标仓库筛选
 * @property page - 页码
 * @property limit - 每页条数
 */
export interface StockTransferListQuery {
  fromWarehouseId?: string;
  toWarehouseId?: string;
  page?: number;
  limit?: number;
}
