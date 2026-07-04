import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  EmptyState,
  StoreCatalogHeader,
  StoreCatalogToolbar,
  StoreFeaturedHero,
} from '@meridian/ui/server';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart, type Product } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ProductGrid } from './_components/product-grid';

interface StoreHomePageProps {
  params: Promise<{ slug: string }>;
}

function getFromPrice(variants: Product['variants']): number {
  const active = variants.filter((v) => v.isActive);
  if (active.length === 0) return 0;
  return Math.min(...active.map((v) => Number(v.price)));
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
  const featured = products[0];

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
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
          title={featured.name}
          description={featured.description ?? undefined}
          price={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(getFromPrice(featured.variants))}
          href={`/s/${slug}/products/${featured.slug}`}
          ctaLabel={t('product.viewProduct')}
        />
      ) : null}

      <StoreCatalogToolbar title={t('home.allProducts')} />

      {products.length === 0 ? (
        <EmptyState title={t('home.empty')} />
      ) : (
        <ProductGrid products={products} storeSlug={slug} />
      )}
    </StoreShellWrapper>
  );
}
