import { cookies } from 'next/headers';
import { FULFILLMENT_SLUG_COOKIE, type PublishedStoreListResponse } from '@meridian/shared';

import { apiFetch } from './api';

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

export function catalogApiPath(fulfillmentSlug: string, productSlug?: string): string {
  const params = new URLSearchParams({ fulfillment: fulfillmentSlug });
  if (productSlug) {
    return `/store/catalog/products/${productSlug}?${params}`;
  }
  return `/store/catalog?${params}`;
}
