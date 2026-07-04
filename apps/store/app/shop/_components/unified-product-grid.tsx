import { getTranslations } from 'next-intl/server';
import { EmptyState, ProductCard } from '@meridian/ui/server';
import type { UnifiedStoreProduct } from '@meridian/shared';

import {
  unifiedProductFromPrice,
  unifiedProductInStock,
} from '@/lib/pricing';

interface UnifiedProductGridProps {
  products: UnifiedStoreProduct[];
  fulfillmentSlug: string;
}

export async function UnifiedProductGrid({
  products,
  fulfillmentSlug,
}: UnifiedProductGridProps) {
  const t = await getTranslations('store');

  if (!products?.length) {
    return <EmptyState title={t('home.empty')} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const inStock = unifiedProductInStock(product);
        return (
          <ProductCard
            key={product.id}
            variant="store"
            name={product.name}
            slug={product.slug}
            storeSlug={fulfillmentSlug}
            href={`/shop/products/${product.slug}`}
            priceFrom={unifiedProductFromPrice(product)}
            outOfStock={!inStock}
            outOfStockLabel={t('catalog.outOfStock')}
            addToCartLabel={t('product.addToCart')}
          />
        );
      })}
    </div>
  );
}
