import type { ProcurementReceivingAddressSnapshot } from './procurement-addresses.js';

export type BranchPurchaseOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface BranchProcurementCatalogItem {
  id: string;
  skuCode: string;
  name: string;
  quantityOnHand: number;
  wholesalePrice: string | number;
  retailPrice: string | number;
  isActive: boolean;
}

export interface BranchPurchaseOrderLineInput {
  masterSkuId: string;
  quantity: number;
}

export interface CreateBranchPurchaseOrderRequest {
  note?: string;
  receivingAddressId?: string;
  lines: BranchPurchaseOrderLineInput[];
}

export interface BranchPurchaseOrderLineSummary {
  id: string;
  masterSkuId: string;
  skuCode: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitWholesalePrice: string | number;
  lineTotal: string | number;
}

export interface BranchPurchaseOrderSummary {
  id: string;
  orderNumber: string;
  status: BranchPurchaseOrderStatus;
  totalAmount: string | number;
  lineCount: number;
  paidAt: string | null;
  createdAt: string;
}

export interface BranchPurchaseOrderDetail extends BranchPurchaseOrderSummary {
  note: string | null;
  allocationOrderId: string | null;
  receivingAddress: ProcurementReceivingAddressSnapshot | null;
  mockPayment: boolean;
  lines: BranchPurchaseOrderLineSummary[];
  payment: {
    status: string;
    paidAt: string | null;
    provider: string;
  } | null;
}
