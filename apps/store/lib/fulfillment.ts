import { cookies } from 'next/headers';
import {
  appendStoreCatalogQuery,
  FULFILLMENT_SLUG_COOKIE,
  parseCatalogSearchParams,
  type PublishedStoreListResponse,
  type StoreCatalogQuery,
} from '@meridian/shared';

import { apiFetch } from './api';

export { parseCatalogSearchParams } from '@meridian/shared';

export async function getFulfillmentSlug(): Promise<string> {
  const cookieStore = await cookies();
  const remembered = cookieStore.get(FULFILLMENT_SLUG_COOKIE)?.value;
  if (remembered) return remembered;

  const stores = await apiFetch<PublishedStoreListResponse>('/store/stores').catch(() => ({
    items: [],
  }));
  const flagship = stores.items.find((s) => s.isFlagship);
  return flagship?.slug ?? stores.items[0]?.slug ?? '';
}

export function catalogApiPath(
  fulfillmentSlug: string,
  productSlug?: string,
  query?: StoreCatalogQuery,
): string {
  const params = new URLSearchParams({ fulfillment: fulfillmentSlug });
  appendStoreCatalogQuery(params, query);
  if (productSlug) {
    return `/store/catalog/products/${productSlug}?${params}`;
  }
  return `/store/catalog?${params}`;
}

export function catalogFiltersApiPath(fulfillmentSlug: string): string {
  return `/store/catalog/filters?fulfillment=${encodeURIComponent(fulfillmentSlug)}`;
}
