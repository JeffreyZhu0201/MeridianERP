import { getTranslations } from 'next-intl/server';
import { BentoDashboardFrame, BentoMetricTile, BentoTile, EmptyState } from '@meridian/ui/server';
import type { UnifiedStoreCatalogResponse } from '@meridian/shared';

import { ShopShellWrapper } from '@/components/shop-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { catalogApiPath, getFulfillmentSlug } from '@/lib/fulfillment';
import { UnifiedProductGrid } from './_components/unified-product-grid';

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
      <BentoDashboardFrame title={t('home.shop')} description={t('home.browseCatalog')}>
        <BentoTile colSpan={2} rowSpan={2}>
          <div className="flex h-full flex-col justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{storeName}</p>
              <h2 className="text-2xl font-semibold tracking-tight">{t('home.browseCatalog')}</h2>
              <p className="text-sm text-muted-foreground">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
            </div>
            {featured ? (
              <div className="rounded-lg ring-1 ring-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Featured</p>
                <a
                  href={`/shop/products/${featured.slug}`}
                  className="mt-1 block text-lg font-medium hover:text-primary"
                >
                  {featured.name}
                </a>
              </div>
            ) : null}
          </div>
        </BentoTile>
        <BentoMetricTile title={t('nav.cart')} value={cartCount} />
        <BentoMetricTile title="Catalog" value={products.length} />
        <BentoTile colSpan={4}>
          <div className="p-4 md:p-6">
            {products.length === 0 ? (
              <EmptyState title={t('home.empty')} />
            ) : (
              <UnifiedProductGrid products={products} fulfillmentSlug={fulfillmentSlug} />
            )}
          </div>
        </BentoTile>
      </BentoDashboardFrame>
    </ShopShellWrapper>
  );
}
