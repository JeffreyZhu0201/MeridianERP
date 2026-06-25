import { getTranslations } from 'next-intl/server';
import { ProductCard } from '@meridian/ui';

import type { Product } from '@/lib/api';

interface ProductGridProps {
  products: Product[];
  storeSlug: string;
}

function getFromPrice(variants: Product['variants']): number {
  const active = variants.filter((v) => v.isActive);
  if (active.length === 0) return 0;
  return Math.min(...active.map((v) => Number(v.price)));
}

export async function ProductGrid({ products, storeSlug }: ProductGridProps) {
  const t = await getTranslations('store');

  if (!products?.length) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">{t('home.empty')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          name={product.name}
          slug={product.slug}
          storeSlug={storeSlug}
          priceFrom={getFromPrice(product.variants)}
        />
      ))}
    </div>
  );
}
