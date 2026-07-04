import type { UnifiedStoreProduct } from '@meridian/shared';

import type { Product } from './api';

export function branchProductFromPrice(variants: Product['variants']): number {
  const active = variants.filter((v) => v.isActive);
  if (active.length === 0) return 0;
  return Math.min(...active.map((v) => Number(v.price)));
}

export function unifiedProductFromPrice(product: UnifiedStoreProduct): number {
  const branchPrices = product.variants
    .filter((v) => v.inStock && v.branchPrice != null)
    .map((v) => Number(v.branchPrice));
  if (branchPrices.length > 0) return Math.min(...branchPrices);

  const flagshipPrices = product.variants.map((v) => Number(v.flagshipPrice));
  return flagshipPrices.length > 0 ? Math.min(...flagshipPrices) : 0;
}

export function unifiedProductInStock(product: UnifiedStoreProduct): boolean {
  return product.variants.some((v) => v.inStock);
}
