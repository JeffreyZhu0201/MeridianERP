import type { StoreCatalogQuery, StoreCatalogSort } from './flagship-catalog.js';
export declare const STORE_CATALOG_SORT_VALUES: StoreCatalogSort[];
export declare function parseStoreCatalogQuery(input: {
    category?: string;
    inStock?: string | boolean;
    q?: string;
    sort?: string;
}): StoreCatalogQuery;
export declare function parseCatalogSearchParams(searchParams: Record<string, string | string[] | undefined>): StoreCatalogQuery;
export declare function appendStoreCatalogQuery(params: URLSearchParams, query?: StoreCatalogQuery): void;
export declare function buildCatalogQueryString(current: StoreCatalogQuery, patch?: Partial<StoreCatalogQuery>): string;
