import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  BentoDashboardFrame,
  BentoMetricTile,
  BentoTile,
  EmptyState,
} from '@meridian/ui';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart, type Product } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ProductGrid } from './_components/product-grid';

interface StoreHomePageProps {
  params: Promise<{ slug: string }>;
}

function getFromPrice(variants: Product['variants']): number {
  const active = variants.filter((variant) => variant.isActive);
  if (active.length === 0) return 0;
  return Math.min(...active.map((variant) => Number(variant.price)));
}

export default async function StoreHomePage({ params }: StoreHomePageProps) {
  const { slug } = await params;
  const token = await getToken();
  const t = await getTranslations('store');

  const [products, cart] = await Promise.all([
    apiFetch<Product[]>(storePath(slug, 'products')).catch(() => []),
    apiFetch<Cart>(storePath(slug, 'cart'), {}, token).catch(() => null),
  ]);

  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const isEmpty = products.length === 0;
  const featured = products[0];

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <BentoDashboardFrame title={t('home.shop')} description={t('home.browseCatalog')}>
        <BentoTile colSpan={2} rowSpan={2}>
          <div className="flex h-full flex-col justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {storeName}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">{t('home.browseCatalog')}</h2>
              <p className="text-sm text-muted-foreground">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
            </div>
            {featured ? (
              <div className="rounded-lg ring-1 ring-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Featured</p>
                <Link
                  href={`/s/${slug}/products/${featured.slug}`}
                  className="mt-1 block text-lg font-medium hover:text-primary"
                >
                  {featured.name}
                </Link>
                <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                  From ${getFromPrice(featured.variants).toFixed(2)}
                </p>
              </div>
            ) : null}
          </div>
        </BentoTile>
        <BentoMetricTile title={t('nav.cart')} value={cartCount} />
        <BentoMetricTile title="Catalog" value={products.length} />
        <BentoTile colSpan={4}>
          <div className="p-4 md:p-6">
            {isEmpty ? (
              <EmptyState title={t('home.empty')} />
            ) : (
              <ProductGrid products={products} storeSlug={slug} />
            )}
          </div>
        </BentoTile>
      </BentoDashboardFrame>
    </StoreShellWrapper>
  );
}
