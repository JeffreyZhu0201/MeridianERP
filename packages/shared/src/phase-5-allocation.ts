import type { AllocationOrderStatus, ReplenishmentRequestStatus } from './phase-5-distribution.js';

export interface MasterSkuSummary {
  id: string;
  skuCode: string;
  name: string;
  quantityOnHand: number;
  cumulativeShippedQty: number;
  unitCost: string | number;
  wholesalePrice: string | number;
  retailPrice: string | number;
  isActive: boolean;
}

export interface CreateMasterSkuRequest {
  skuCode: string;
  name: string;
  quantityOnHand?: number;
  unitCost: number;
  wholesalePrice: number;
  retailPrice: number;
}

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

export interface ReplenishmentRequestSummary {
  id: string;
  tenantId: string;
  status: ReplenishmentRequestStatus;
  note: string | null;
  lineCount: number;
  createdAt: string;
}

export interface CreateReplenishmentRequest {
  note?: string;
  lines: Array<{ masterSkuId: string; quantity: number }>;
}
