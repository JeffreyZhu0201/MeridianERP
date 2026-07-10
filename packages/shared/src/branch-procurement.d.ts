import type { ProcurementReceivingAddressSnapshot } from './procurement-addresses.js';
export type BranchPurchaseOrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';
export declare const BRANCH_PURCHASE_ORDER_STATUSES: readonly ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "RECEIVED", "CANCELLED"];
export declare const PLATFORM_PROCUREMENT_TAB_STATUSES: readonly ["PROCESSING", "SHIPPED", "RECEIVED", "ALL"];
export type PlatformProcurementTabStatus = (typeof PLATFORM_PROCUREMENT_TAB_STATUSES)[number];
export declare function isBranchPurchaseOrderStatus(value: string): value is BranchPurchaseOrderStatus;
export declare function formatBranchPurchaseOrderStatus(status: string, labels: Record<BranchPurchaseOrderStatus, string>): string;
export interface PlatformProcurementOrderLine {
    skuCode: string;
    productName: string;
    quantityOrdered: number;
    unitWholesalePrice: string | number;
}
export interface PlatformProcurementOrderSummary {
    id: string;
    orderNumber: string;
    tenantId: string;
    tenantName: string;
    status: BranchPurchaseOrderStatus;
    totalAmount: string | number;
    lineCount: number;
    paidAt: string | null;
    allocationOrderId: string | null;
    createdAt: string;
    lines: PlatformProcurementOrderLine[];
    receivingAddress: ProcurementReceivingAddressSnapshot | null;
}
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
