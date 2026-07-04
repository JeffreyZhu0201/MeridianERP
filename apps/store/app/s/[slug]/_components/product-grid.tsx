import { getTranslations } from 'next-intl/server';
import { EmptyState, ProductCard } from '@meridian/ui/server';

import { branchProductFromPrice } from '@/lib/pricing';
import type { Product } from '@/lib/api';

interface ProductGridProps {
  products: Product[];
  storeSlug: string;
}

export async function ProductGrid({ products, storeSlug }: ProductGridProps) {
  const t = await getTranslations('store');

  if (!products?.length) {
    return <EmptyState title={t('home.empty')} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          variant="store"
          name={product.name}
          slug={product.slug}
          storeSlug={storeSlug}
          priceFrom={branchProductFromPrice(product.variants)}
          addToCartLabel={t('product.addToCart')}
        />
      ))}
    </div>
  );
}
