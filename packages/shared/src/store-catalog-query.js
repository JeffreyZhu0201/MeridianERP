"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORE_CATALOG_SORT_VALUES = void 0;
exports.parseStoreCatalogQuery = parseStoreCatalogQuery;
exports.parseCatalogSearchParams = parseCatalogSearchParams;
exports.appendStoreCatalogQuery = appendStoreCatalogQuery;
exports.buildCatalogQueryString = buildCatalogQueryString;
exports.STORE_CATALOG_SORT_VALUES = [
    'newest',
    'name_asc',
    'price_asc',
    'price_desc',
];
function parseStoreCatalogQuery(input) {
    const query = {};
    if (typeof input.category === 'string' && input.category.trim()) {
        query.category = input.category.trim();
    }
    if (input.inStock === true ||
        input.inStock === 'true' ||
        input.inStock === '1') {
        query.inStock = true;
    }
    if (typeof input.q === 'string' && input.q.trim()) {
        query.q = input.q.trim();
    }
    if (input.sort &&
        exports.STORE_CATALOG_SORT_VALUES.includes(input.sort)) {
        query.sort = input.sort;
    }
    return query;
}
function parseCatalogSearchParams(searchParams) {
    const inStock = searchParams.inStock;
    const inStockValue = typeof inStock === 'string' ? inStock : inStock?.[0];
    return parseStoreCatalogQuery({
        category: typeof searchParams.category === 'string' ? searchParams.category : undefined,
        inStock: inStockValue,
        q: typeof searchParams.q === 'string' ? searchParams.q : undefined,
        sort: typeof searchParams.sort === 'string' ? searchParams.sort : undefined,
    });
}
function appendStoreCatalogQuery(params, query) {
    if (!query)
        return;
    if (query.category)
        params.set('category', query.category);
    if (query.inStock)
        params.set('inStock', 'true');
    if (query.q)
        params.set('q', query.q);
    if (query.sort && query.sort !== 'newest')
        params.set('sort', query.sort);
}
function buildCatalogQueryString(current, patch = {}) {
    const params = new URLSearchParams();
    appendStoreCatalogQuery(params, { ...current, ...patch });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}
//# sourceMappingURL=store-catalog-query.js.map