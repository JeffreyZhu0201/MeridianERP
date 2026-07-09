import { getLocale, getTranslations } from 'next-intl/server';
import
  {
    EmptyState,
    formatMoney,
    StoreCatalogHeader,
    StoreFeaturedHero,
  } from '@meridian/ui/server';
import { StoreCatalogExplorer } from '@meridian/ui';
import type {
  StoreCatalogFiltersResponse,
  StoreCatalogSort,
  UnifiedStoreCatalogResponse,
} from '@meridian/shared';

import { ShopShellWrapper } from '@/components/shop-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getToken } from '@/lib/auth';
import
  {
    catalogApiPath,
    catalogFiltersApiPath,
    getFulfillmentSlug,
    parseCatalogSearchParams,
  } from '@/lib/fulfillment';
import { unifiedProductFromPrice } from '@/lib/pricing';
import { UnifiedProductGrid } from './_components/unified-product-grid';

interface ShopPageProps
{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = 'force-dynamic';

export default async function ShopPage ({ searchParams }: ShopPageProps)
{
  const fulfillmentSlug = await getFulfillmentSlug();
  const token = await getToken();
  const locale = await getLocale();
  const t = await getTranslations('store');
  const catalogQuery = parseCatalogSearchParams(await searchParams);

  if (!fulfillmentSlug) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState title={ t('home.pickerEmpty') } description={ t('home.pickerEmptyDescription') } />
      </div>
    );
  }

  const sortLabels: Record<StoreCatalogSort, string> = {
    newest: t('catalogToolbar.sortNewest'),
    name_asc: t('catalogToolbar.sortNameAsc'),
    price_asc: t('catalogToolbar.sortPriceAsc'),
    price_desc: t('catalogToolbar.sortPriceDesc'),
  };

  let catalogError: string | null = null;
  const [catalogResult, filters, cart] = await Promise.all([
    apiFetch<UnifiedStoreCatalogResponse>(
      catalogApiPath(fulfillmentSlug, undefined, catalogQuery),
    ).catch((err: unknown) =>
    {
      catalogError = err instanceof Error ? err.message : 'Failed to load catalog';
      return {
        fulfillmentSlug,
        flagshipSlug: fulfillmentSlug,
        items: [],
      } satisfies UnifiedStoreCatalogResponse;
    }),
    apiFetch<StoreCatalogFiltersResponse>(catalogFiltersApiPath(fulfillmentSlug)).catch(() => ({
      categories: [],
    })),
    apiFetch<Cart>(storePath(fulfillmentSlug, 'cart'), {}, token).catch(() => null),
  ]);

  const catalog = catalogResult;

  const products = catalog.items;
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const featured = products[0];
  const storeName = fulfillmentSlug.charAt(0).toUpperCase() + fulfillmentSlug.slice(1);

  return (
    <ShopShellWrapper
      fulfillmentSlug={ fulfillmentSlug }
      storeName={ storeName }
      cartCount={ cartCount }
    >
      <StoreCatalogHeader
        title={ t('home.shop') }
        description={ t('home.browseCatalog') }
        metrics={ [
          { title: t('home.catalogMetric'), value: products.length },
          {
            title: t('nav.cart'),
            value: cartCount === 0 ? '0' : t('home.cartItems', { count: cartCount }),
            accent: cartCount > 0,
          },
        ] }
      />

      { featured ? (
        <StoreFeaturedHero
          badge={ t('home.flagshipBadge') }
          title={ featured.name }
          description={ featured.description ?? undefined }
          price={ formatMoney(unifiedProductFromPrice(featured), locale) }
          href={ `/shop/products/${featured.slug}` }
          ctaLabel={ t('product.viewProduct') }
        />
      ) : null }

      <StoreCatalogExplorer
        title={ t('home.allProducts') }
        basePath="/shop"
        categories={ filters.categories }
        current={ catalogQuery }
        sortLabels={ sortLabels }
        filterLabel={ t('catalogToolbar.filter') }
        sortLabel={ t('catalogToolbar.sort') }
        searchPlaceholder={ t('catalogToolbar.searchPlaceholder') }
        clearSearchLabel={ t('catalogToolbar.clearSearch') }
        searchingLabel={ t('catalogToolbar.searching') }
        allCategoriesLabel={ t('catalogToolbar.allCategories') }
        inStockOnlyLabel={ t('catalogToolbar.inStockOnly') }
      >
        { catalogError ? (
          <EmptyState title={ t('home.catalogLoadError') } description={ catalogError } />
        ) : products.length === 0 ? (
          <EmptyState
            title={ catalogQuery.q ? t('home.emptySearch') : t('home.empty') }
          />
        ) : (
          <UnifiedProductGrid
            key={ fulfillmentSlug }
            products={ products }
            fulfillmentSlug={ fulfillmentSlug }
          />
        ) }
      </StoreCatalogExplorer>
    </ShopShellWrapper>
  );
}
