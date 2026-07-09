import { cookies } from "next/headers";
import {
  appendStoreCatalogQuery,
  FULFILLMENT_SLUG_COOKIE,
  parseCatalogSearchParams,
  type PublishedStoreListResponse,
  type StoreCatalogQuery,
} from "@meridian/shared";

import { apiFetch } from "./api";

export { parseCatalogSearchParams } from "@meridian/shared";

async function listBranchStores(): Promise<
  PublishedStoreListResponse["items"]
> {
  const stores = await apiFetch<PublishedStoreListResponse>(
    "/store/stores",
  ).catch(() => ({
    items: [],
  }));
  return stores.items.filter((store) => !store.isFlagship);
}

export async function getFulfillmentSlug(): Promise<string> {
  const branchStores = await listBranchStores();
  if (branchStores.length === 0) return "";

  const cookieStore = await cookies();
  const remembered = cookieStore.get(FULFILLMENT_SLUG_COOKIE)?.value;
  if (remembered) {
    const match = branchStores.find((store) => store.slug === remembered);
    if (match) return match.slug;
  }

  return branchStores[0]!.slug;
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
