import type { LowStockAlertItem } from '@meridian/shared';

export interface ReplenishmentContext {
  tenantId: string;
  isFlagship: boolean;
  businessName?: string;
  defaultReorderThreshold: number;
  alerts: LowStockAlertItem[];
  recentOutbound?: Array<{
    variantId: string;
    sku: string;
    totalQty: number;
  }>;
  pendingProcurement?: Array<{
    masterSkuId?: string;
    variantId?: string;
    sku: string;
    qtyPending: number;
  }>;
}

export interface ProductCopyContext {
  product?: {
    id: string;
    name: string;
    description: string | null;
    categoryName: string | null;
    isPublished: boolean;
  };
  draft?: {
    name?: string;
    description?: string;
    categoryName?: string;
    sku?: string;
    price?: number;
  };
  variant?: {
    sku: string;
    price: number;
    masterSkuRetailPrice?: number;
  };
  isBranchLinked: boolean;
}
