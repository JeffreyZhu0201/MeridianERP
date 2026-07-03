# Flagship Catalog & Unified Store — Architecture

**Updated:** 2026-07-03

## Tenants

| Role | Tenant | Data |
|------|--------|------|
| catalogTenant | `isFlagship` merchant | Product catalog synced from MasterSku |
| fulfillmentTenant | Selected branch slug | Cart, orders, inventory, pickup |

## MasterSku pricing

| Field | Meaning |
|-------|---------|
| `unitCost` | Internal cost |
| `wholesalePrice` | Branch allocation / COGS |
| `retailPrice` | Suggested retail (branch default on allocation) |
| `flagshipPrice` | Flagship store consumer price |

## Sync flow

On MasterSku create/update → `FlagshipCatalogService.syncMasterSku(id)`:

1. Resolve flagship `MerchantProfile` (`isFlagship: true`)
2. Upsert `Product` + `ProductVariant` on flagship tenant
3. `variant.price = flagshipPrice`, `masterSkuId` set, `isPublished` from `isActive`

## Store catalog API

```
GET /store/catalog?fulfillment={branchSlug}
GET /store/catalog/products/:productSlug?fulfillment={branchSlug}
```

1. Load flagship tenant products (published)
2. For each variant with `masterSkuId`, find fulfillment tenant variant by same `masterSkuId`
3. Return unified DTO: catalog fields from flagship + `branchPrice`, `inventory`, `inStock`

Checkout/cart remain scoped to **fulfillment** tenant slug.

## Price deviation

`PlatformSettings.maxRetailPriceDeviationPercent` (default 10). Branch variant price must satisfy:

`|price - retailPrice| / retailPrice <= maxPercent / 100`

## Allocation

Unchanged: `confirmAllocation` creates branch variant with `price = retailPrice`, links `masterSkuId`, adds warehouse stock.
