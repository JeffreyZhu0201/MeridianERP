import type { AllocationOrderStatus } from './phase-5-distribution.js';
import type { MasterSkuImageInput, MasterSkuImageSummary } from './media.js';
export interface MasterSkuSummary {
    id: string;
    skuCode: string;
    name: string;
    description?: string | null;
    shortDescription?: string | null;
    quantityOnHand: number;
    cumulativeShippedQty: number;
    unitCost: string | number;
    wholesalePrice: string | number;
    retailPrice: string | number;
    flagshipPrice: string | number;
    isActive: boolean;
    synced?: boolean;
    flagshipProductId?: string | null;
    images?: MasterSkuImageSummary[];
}
export interface CreateMasterSkuRequest {
    skuCode: string;
    name: string;
    description?: string;
    shortDescription?: string;
    quantityOnHand?: number;
    unitCost: number;
    wholesalePrice: number;
    retailPrice: number;
    flagshipPrice: number;
    images?: MasterSkuImageInput[];
}
export interface UpdateMasterSkuRequest {
    name?: string;
    description?: string | null;
    shortDescription?: string | null;
    quantityOnHand?: number;
    unitCost?: number;
    wholesalePrice?: number;
    retailPrice?: number;
    flagshipPrice?: number;
    isActive?: boolean;
    images?: MasterSkuImageInput[];
}
export type { MasterSkuImageInput, MasterSkuImageSummary };
export interface AllocationOrderLineInput {
    masterSkuId: string;
    quantity: number;
}
export interface AllocationOrderSummary {
    id: string;
    tenantId: string;
    tenantName: string;
    status: AllocationOrderStatus;
    issuedAt: string | null;
    confirmedAt: string | null;
    lineCount: number;
    totalWholesale: string | number;
    createdAt: string;
}
