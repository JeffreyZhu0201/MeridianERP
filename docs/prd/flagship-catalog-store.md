# Flagship Catalog & Unified Store — PRD

**Version:** 1.0.0  
**Updated:** 2026-07-03

## Overview

HQ defines MasterSku with wholesale, suggested retail, and flagship selling prices. The flagship tenant catalog is auto-synced from Admin. All branches sell the same catalog; stock and fulfillment follow the branch selected in the Store header dropdown. Branch selling prices default to suggested retail and may deviate within a platform-configured percentage.

## User Stories

### US-FC1 — Admin flagship catalog

As HQ admin, I manage MasterSku with unit cost, wholesale price, suggested retail, and flagship price; saving syncs products to the flagship store tenant.

**Acceptance:** Create/edit MasterSku shows all price fields; flagship tenant gets matching published products; manual sync endpoint works.

### US-FC2 — Unified store catalog

As a consumer, I open the store and see flagship catalog by default; I pick a branch from the header dropdown; prices and stock reflect that branch.

**Acceptance:** `GET /store/catalog?fulfillment={slug}` returns flagship products with branch inventory and price; out-of-stock items are marked.

### US-FC3 — Branch stock from allocation

As a consumer shopping a branch, I see out of stock when the branch has not received allocation or inventory is zero.

**Acceptance:** Unallocated branch shows `inStock: false`; after CONFIRMED allocation, inventory reflects warehouse qty.

### US-FC4 — Branch price tuning

As a branch merchant, I may adjust selling price within ±N% of suggested retail (platform default 10%).

**Acceptance:** PATCH product price outside range returns 400; within range succeeds.

### US-FC5 — Store entry without picker page

As a consumer, landing on `/` goes to `/shop` with flagship catalog; branch selection is a header dropdown, not a full-page store picker.

**Acceptance:** No store picker on home; `/shop` loads catalog; remembered branch slug preferred over flagship default.

### US-FC6 — Dark mode primary buttons

Primary CTAs in dark mode use white fill with dark text per design system.

## Out of scope

- Branch-created SKUs without MasterSku link
- Removing `/s/{slug}` deep links entirely
