# Flagship Catalog & Unified Store — Design

**Updated:** 2026-07-03

## Admin — Flagship catalog (`/flagship-catalog` or allocations extension)

- Table: skuCode, name, wholesale, suggested retail, flagship price, HQ stock, sync status
- Create/Edit dialog: unitCost + three consumer-facing prices
- Save triggers sync; manual "Sync all" button

## Store — `/shop`

- Home `/` redirects to `/shop`
- `StoreShell` header: branch `<Select>` (flagship badge on option), cart, account
- Product grid: out-of-stock badge on cards
- PDP: disable add-to-cart when `inStock: false`
- Cookie `meridian_fulfillment_slug` + localStorage remembered slug

## Merchant — Catalog

- Linked products show suggested retail, current price, allowed range hint
- Hide or disable "Create product" for branches (catalog from HQ only)

## Dark mode

- `--primary: 0 0% 98%`, `--primary-foreground: 240 10% 3.9%` in `.dark`
