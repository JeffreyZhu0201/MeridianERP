import { getTranslations } from 'next-intl/server';
import {
  EmptyState,
  StoreCatalogHeader,
  StoreCatalogToolbar,
  StoreFeaturedHero,
} from '@meridian/ui/server';
import type { UnifiedStoreCatalogResponse } from '@meridian/shared';

import { ShopShellWrapper } from '@/components/shop-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { catalogApiPath, getFulfillmentSlug } from '@/lib/fulfillment';
import { UnifiedProductGrid } from './_components/unified-product-grid';

function getFeaturedPrice(product: UnifiedStoreCatalogResponse['items'][0]): string {
  const prices = product.variants
    .filter((v) => v.inStock)
    .map((v) => Number(v.branchPrice ?? v.flagshipPrice));
  const min = prices.length ? Math.min(...prices) : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(min);
}

export default async function ShopPage() {
  const fulfillmentSlug = await getFulfillmentSlug();
  const token = await getToken();
  const t = await getTranslations('store');

  if (!fulfillmentSlug) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState title={t('home.pickerEmpty')} description={t('home.pickerEmptyDescription')} />
      </div>
    );
  }

  const [catalog, cart] = await Promise.all([
    apiFetch<UnifiedStoreCatalogResponse>(catalogApiPath(fulfillmentSlug)).catch(() => ({
      fulfillmentSlug,
      flagshipSlug: fulfillmentSlug,
      items: [],
    })),
    apiFetch<Cart>(storePath(fulfillmentSlug, 'cart'), {}, token).catch(() => null),
  ]);

  const products = catalog.items;
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const featured = products[0];
  const storeName = fulfillmentSlug.charAt(0).toUpperCase() + fulfillmentSlug.slice(1);

  return (
    <ShopShellWrapper
      fulfillmentSlug={fulfillmentSlug}
      storeName={storeName}
      cartCount={cartCount}
    >
      <StoreCatalogHeader
        title={t('home.shop')}
        description={t('home.browseCatalog')}
        metrics={[
          { title: 'Catalog', value: products.length },
          {
            title: t('nav.cart'),
            value: cartCount === 0 ? '0' : `${cartCount} items`,
            accent: cartCount > 0,
          },
        ]}
      />

      {featured ? (
        <StoreFeaturedHero
          badge={t('home.flagshipBadge')}
          title={featured.name}
          description={featured.description ?? undefined}
          price={getFeaturedPrice(featured)}
          href={`/shop/products/${featured.slug}`}
          ctaLabel={t('product.viewProduct')}
        />
      ) : null}

      <StoreCatalogToolbar title={t('home.allProducts')} />

      {products.length === 0 ? (
        <EmptyState title={t('home.empty')} />
      ) : (
        <UnifiedProductGrid products={products} fulfillmentSlug={fulfillmentSlug} />
      )}
    </ShopShellWrapper>
  );
}
