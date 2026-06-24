import type { Product } from '@/lib/api';

/** 商品变体下拉选项（服务端/客户端均可使用） */
export interface VariantOption {
  id: string;
  sku: string;
  name: string;
  productName: string;
}

/** 将商品列表展平为变体选项（库存调整等） */
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

/** 采购单表单使用的变体选项 */
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
