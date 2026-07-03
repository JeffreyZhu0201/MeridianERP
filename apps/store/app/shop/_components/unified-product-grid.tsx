import { getTranslations } from 'next-intl/server';
import { EmptyState, ProductCard } from '@meridian/ui/server';
import type { UnifiedStoreProduct } from '@meridian/shared';

interface UnifiedProductGridProps {
  products: UnifiedStoreProduct[];
  fulfillmentSlug: string;
}

function getDisplayPrice(product: UnifiedStoreProduct): number {
  const prices = product.variants
    .filter((v) => v.inStock && v.branchPrice != null)
    .map((v) => Number(v.branchPrice));
  if (prices.length > 0) return Math.min(...prices);
  const flagship = product.variants.map((v) => Number(v.flagshipPrice));
  return flagship.length > 0 ? Math.min(...flagship) : 0;
}

function isProductInStock(product: UnifiedStoreProduct): boolean {
  return product.variants.some((v) => v.inStock);
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => {
        const inStock = isProductInStock(product);
        return (
          <ProductCard
            key={product.id}
            name={product.name}
            slug={product.slug}
            storeSlug={fulfillmentSlug}
            href={`/shop/products/${product.slug}`}
            priceFrom={getDisplayPrice(product)}
            outOfStock={!inStock}
            outOfStockLabel={t('catalog.outOfStock')}
          />
        );
      })}
    </div>
  );
}
