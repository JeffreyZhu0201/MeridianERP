import type { StoreCatalogQuery, StoreCatalogSort } from './flagship-catalog.js';

export const STORE_CATALOG_SORT_VALUES: StoreCatalogSort[] = [
  'newest',
  'name_asc',
  'price_asc',
  'price_desc',
];

export function parseStoreCatalogQuery(input: {
  category?: string;
  inStock?: string | boolean;
  q?: string;
  sort?: string;
}): StoreCatalogQuery {
  const query: StoreCatalogQuery = {};

  if (typeof input.category === 'string' && input.category.trim()) {
    query.category = input.category.trim();
  }

  if (
    input.inStock === true ||
    input.inStock === 'true' ||
    input.inStock === '1'
  ) {
    query.inStock = true;
  }

  if (typeof input.q === 'string' && input.q.trim()) {
    query.q = input.q.trim();
  }

  if (
    input.sort &&
    STORE_CATALOG_SORT_VALUES.includes(input.sort as StoreCatalogSort)
  ) {
    query.sort = input.sort as StoreCatalogSort;
  }

  return query;
}

export function parseCatalogSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): StoreCatalogQuery {
  const inStock = searchParams.inStock;
  const inStockValue =
    typeof inStock === 'string' ? inStock : inStock?.[0];

  return parseStoreCatalogQuery({
    category:
      typeof searchParams.category === 'string' ? searchParams.category : undefined,
    inStock: inStockValue,
    q: typeof searchParams.q === 'string' ? searchParams.q : undefined,
    sort: typeof searchParams.sort === 'string' ? searchParams.sort : undefined,
  });
}

export function appendStoreCatalogQuery(
  params: URLSearchParams,
  query?: StoreCatalogQuery,
): void {
  if (!query) return;
  if (query.category) params.set('category', query.category);
  if (query.inStock) params.set('inStock', 'true');
  if (query.q) params.set('q', query.q);
  if (query.sort && query.sort !== 'newest') params.set('sort', query.sort);
}

export function buildCatalogQueryString(
  current: StoreCatalogQuery,
  patch: Partial<StoreCatalogQuery> = {},
): string {
  const params = new URLSearchParams();
  appendStoreCatalogQuery(params, { ...current, ...patch });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
