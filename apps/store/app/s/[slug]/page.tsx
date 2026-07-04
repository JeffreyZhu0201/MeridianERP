import { getLocale, getTranslations } from 'next-intl/server';
import {
  EmptyState,
  formatMoney,
  StoreCatalogHeader,
  StoreFeaturedHero,
} from '@meridian/ui/server';
import { StoreCatalogExplorer } from '@meridian/ui';
import type { StoreCatalogFiltersResponse, StoreCatalogSort } from '@meridian/shared';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart, type Product } from '@/lib/api';
import { getToken } from '@/lib/auth';
import {
  parseCatalogSearchParams,
  storeProductsApiPath,
  storeProductsFiltersApiPath,
} from '@/lib/fulfillment';
import { branchProductFromPrice } from '@/lib/pricing';
import { ProductGrid } from './_components/product-grid';

interface StoreHomePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StoreHomePage({ params, searchParams }: StoreHomePageProps) {
  const { slug } = await params;
  const token = await getToken();
  const locale = await getLocale();
  const t = await getTranslations('store');
  const catalogQuery = parseCatalogSearchParams(await searchParams);

  const sortLabels: Record<StoreCatalogSort, string> = {
    newest: t('catalogToolbar.sortNewest'),
    name_asc: t('catalogToolbar.sortNameAsc'),
    price_asc: t('catalogToolbar.sortPriceAsc'),
    price_desc: t('catalogToolbar.sortPriceDesc'),
  };

  const [products, filters, cart] = await Promise.all([
    apiFetch<Product[]>(storeProductsApiPath(slug, catalogQuery)).catch(() => []),
    apiFetch<StoreCatalogFiltersResponse>(storeProductsFiltersApiPath(slug)).catch(() => ({
      categories: [],
    })),
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
          { title: t('home.catalogMetric'), value: products.length },
          {
            title: t('nav.cart'),
            value: cartCount === 0 ? '0' : t('home.cartItems', { count: cartCount }),
            accent: cartCount > 0,
          },
        ]}
      />

      {featured ? (
        <StoreFeaturedHero
          title={featured.name}
          description={featured.description ?? undefined}
          price={formatMoney(branchProductFromPrice(featured.variants), locale)}
          href={`/s/${slug}/products/${featured.slug}`}
          ctaLabel={t('product.viewProduct')}
        />
      ) : null}

      <StoreCatalogExplorer
        title={t('home.allProducts')}
        basePath={`/s/${slug}`}
        categories={filters.categories}
        current={catalogQuery}
        sortLabels={sortLabels}
        filterLabel={t('catalogToolbar.filter')}
        sortLabel={t('catalogToolbar.sort')}
        searchPlaceholder={t('catalogToolbar.searchPlaceholder')}
        clearSearchLabel={t('catalogToolbar.clearSearch')}
        searchingLabel={t('catalogToolbar.searching')}
        allCategoriesLabel={t('catalogToolbar.allCategories')}
        inStockOnlyLabel={t('catalogToolbar.inStockOnly')}
      >
        {products.length === 0 ? (
          <EmptyState
            title={catalogQuery.q ? t('home.emptySearch') : t('home.empty')}
          />
        ) : (
          <ProductGrid products={products} storeSlug={slug} />
        )}
      </StoreCatalogExplorer>
    </StoreShellWrapper>
  );
}
