import type { ProductImageSummary } from './media.js';

export interface UnifiedStoreVariant {
  id: string;
  masterSkuId: string;
  sku: string;
  name: string;
  flagshipPrice: string | number;
  suggestedRetailPrice: string | number;
  wholesalePrice: string | number;
  branchVariantId: string | null;
  branchPrice: string | number | null;
  inventory: number;
  inStock: boolean;
}

export interface UnifiedStoreProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription?: string | null;
  category: { id: string; name: string; slug: string } | null;
  variants: UnifiedStoreVariant[];
  images?: ProductImageSummary[];
  primaryImageUrl?: string | null;
}

export type StoreCatalogSort = 'newest' | 'name_asc' | 'price_asc' | 'price_desc';

export interface StoreCatalogQuery {
  category?: string;
  inStock?: boolean;
  q?: string;
  sort?: StoreCatalogSort;
}

export interface StoreCatalogFilterCategory {
  slug: string;
  name: string;
  count: number;
}

export interface StoreCatalogFiltersResponse {
  categories: StoreCatalogFilterCategory[];
}

export interface UnifiedStoreCatalogResponse {
  fulfillmentSlug: string;
  flagshipSlug: string;
  items: UnifiedStoreProduct[];
}

export interface FlagshipCatalogRow {
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
  synced: boolean;
  flagshipProductId: string | null;
  images?: ProductImageSummary[];
  primaryImageUrl?: string | null;
}

export type { ProductImageSummary } from './media.js';

export const FULFILLMENT_SLUG_COOKIE = 'meridian_fulfillment_slug';
