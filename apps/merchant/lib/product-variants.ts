import type { Product } from '@/lib/api';
export interface VariantOption {
  id: string;
  sku: string;
  name: string;
  productName: string;
}
export function productsToVariantOptions(products: Product[]): VariantOption[] {
  return products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      productName: p.name,
    })),
  );
}
export interface PoVariantOption {
  id: string;
  label: string;
}

export function productsToPoVariantOptions(products: Product[]): PoVariantOption[] {
  return products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      label: `${p.name} — ${v.sku}`,
    })),
  );
}
