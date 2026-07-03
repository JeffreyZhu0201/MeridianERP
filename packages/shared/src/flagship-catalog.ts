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
  category: { id: string; name: string; slug: string } | null;
  variants: UnifiedStoreVariant[];
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
  quantityOnHand: number;
  cumulativeShippedQty: number;
  unitCost: string | number;
  wholesalePrice: string | number;
  retailPrice: string | number;
  flagshipPrice: string | number;
  isActive: boolean;
  synced: boolean;
  flagshipProductId: string | null;
}

export const FULFILLMENT_SLUG_COOKIE = 'meridian_fulfillment_slug';
