import type { PurchaseOrderStatus, StockAdjustmentReason, StockTransferStatus } from './enums.js';

/** Tenant inventory configuration (1:1 with Tenant). */
export interface TenantInventorySettings {
  tenantId: string;
  defaultReorderThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantInventorySettingsRequest {
  defaultReorderThreshold: number;
}

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

export interface CreateWarehouseRequest {
  name: string;
  address?: string;
  isDefault?: boolean;
}

export interface UpdateWarehouseRequest {
  name?: string;
  address?: string | null;
  isActive?: boolean;
}

export interface StockLevel {
  id: string;
  tenantId: string;
  warehouseId: string;
  variantId: string;
  quantityOnHand: number;
  createdAt: string;
  updatedAt: string;
}

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

export interface CreateStockAdjustmentRequest {
  warehouseId: string;
  variantId: string;
  quantityDelta: number;
  reason: StockAdjustmentReason;
  note?: string;
}

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

export interface StockAdjustmentWithDetails extends StockAdjustment {
  actor: { id: string; email: string };
  warehouse: Pick<Warehouse, 'id' | 'name'>;
  variant: { id: string; sku: string; name: string; productName: string };
}

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

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  variantId: string;
  quantityOrdered: number;
  quantityReceived: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLineWithVariant extends PurchaseOrderLine {
  variant: { id: string; sku: string; name: string; productName: string };
  quantityRemaining: number;
}

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

export interface CreatePurchaseOrderLineRequest {
  variantId: string;
  quantityOrdered: number;
}

export interface CreatePurchaseOrderRequest {
  warehouseId: string;
  supplierName: string;
  status: 'DRAFT' | 'ORDERED';
  lines: CreatePurchaseOrderLineRequest[];
}

export interface UpdatePurchaseOrderRequest {
  supplierName?: string;
  warehouseId?: string;
  lines?: CreatePurchaseOrderLineRequest[];
}

export interface PurchaseOrderReceiptLine {
  id: string;
  receiptId: string;
  purchaseOrderLineId: string;
  quantityReceived: number;
}

export interface PurchaseOrderReceipt {
  id: string;
  tenantId: string;
  purchaseOrderId: string;
  receivedById: string;
  note: string | null;
  lines: PurchaseOrderReceiptLine[];
  createdAt: string;
}

export interface ReceivePurchaseOrderLineRequest {
  purchaseOrderLineId: string;
  quantityReceived: number;
}

export interface ReceivePurchaseOrderRequest {
  note?: string;
  lines: ReceivePurchaseOrderLineRequest[];
}

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

export interface UpdateVariantReorderThresholdRequest {
  reorderThreshold: number | null;
}

/** Platform read-only tenant inventory summary. */
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

/** BullMQ: inventory queue low-stock-check job payload. */
export interface LowStockCheckJobPayload {
  tenantId: string;
  variantId?: string;
  warehouseId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface StockLevelListQuery {
  warehouseId?: string;
  variantId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface AdjustmentListQuery {
  from?: string;
  to?: string;
  reason?: StockAdjustmentReason;
  warehouseId?: string;
  variantId?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseOrderListQuery {
  status?: PurchaseOrderStatus;
  warehouseId?: string;
  page?: number;
  limit?: number;
}

export interface StockTransferLine {
  id: string;
  transferId: string;
  variantId: string;
  quantity: number;
}

export interface StockTransferLineWithVariant extends StockTransferLine {
  variant: { id: string; sku: string; name: string; productName: string };
}

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

export interface CreateStockTransferLineRequest {
  variantId: string;
  quantity: number;
}

export interface CreateStockTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  note?: string;
  lines: CreateStockTransferLineRequest[];
}

export interface StockTransferWithDetails extends StockTransfer {
  fromWarehouse: Pick<Warehouse, 'id' | 'name'>;
  toWarehouse: Pick<Warehouse, 'id' | 'name'>;
  createdBy: { id: string; email: string };
  lines: StockTransferLineWithVariant[];
}

export interface StockTransferListQuery {
  fromWarehouseId?: string;
  toWarehouseId?: string;
  page?: number;
  limit?: number;
}
