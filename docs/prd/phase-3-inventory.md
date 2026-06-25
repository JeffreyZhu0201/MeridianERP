# Phase 3 Inventory — Product Requirements

**Status:** ✅ Shipped (API + merchant UI) · P0 tests green · See [platform overview](./platform-overview.md)

## Implementation Status (2025-06-25)

| ID | Story | Priority | API | Merchant UI | Tests |
|----|-------|----------|-----|-------------|-------|
| US-3.1 | Warehouses / default warehouse | P0 | ✅ | ✅ | `inventory-warehouses.e2e-spec.ts` |
| US-3.2 | Stock levels per warehouse + migration | P0 | ✅ | ✅ | `inventory-warehouses.e2e-spec.ts` |
| US-3.3 | Auditable adjustments | P0 | ✅ | ✅ | `inventory-adjustments.e2e-spec.ts` |
| US-3.4 | Low-stock alerts | P0 | ✅ | ✅ (nav badge) | `inventory-adjustments.e2e-spec.ts` |
| US-3.5 | Create purchase orders | P0 | ✅ | ✅ | `inventory-purchase-orders.e2e-spec.ts` |
| US-3.6 | Receive goods against PO | P0 | ✅ | ✅ | `inventory-purchase-orders.e2e-spec.ts` |
| US-3.7 | Inventory reports + CSV | P0 | ✅ | ✅ | `inventory-reports.e2e-spec.ts` |
| US-3.8 | Checkout stock validation | P0 | ✅ | N/A (store) | `store-checkout.e2e-spec.ts` |
| US-3.9 | Per-variant reorder thresholds | P1 | ✅ | ✅ | adjustments e2e |
| US-3.10 | PO list/filter/detail | P1 | ✅ | ✅ | PO e2e |
| US-3.11 | Cancel unreceived PO | P1 | ✅ | ✅ | PO e2e |
| US-3.12 | Export report CSV | P1 | ✅ | ✅ | `inventory-reports.e2e-spec.ts` |
| US-3.13 | Platform read-only inventory | P1 | ✅ | — | ✅ Admin hidden route |
| US-3.14 | Sellable qty in catalog | P1 | ✅ | ✅ (variant `inventory` cache) | — |
| US-3.15 | Inter-warehouse transfers | P2 | ❌ | ❌ | — |
| US-3.16–3.18 | GL, hierarchies, analytics | P2 | ❌ | ❌ | Deferred |

### Merchant inventory routes (all implemented)

`/inventory/warehouses` · `/inventory/stock` · `/inventory/adjustments` · `/inventory/alerts` · `/inventory/purchase-orders` (+ `/new`, `/[id]`) · `/inventory/reports` · `/inventory/settings`

### Architecture decisions (locked)

See `docs/architecture/phase-3-inventory.md` for full detail. Summary:

- `ProductVariant.inventory` = **cached sellable aggregate** synced on every stock movement (default warehouse on-hand)
- All mutations through `InventoryService` with transactional hard-block on negative stock
- PO receive model: `PurchaseOrderReceipt` events, multiple partial receives per line
- RBAC: owner + staff may adjust/receive; warehouse CRUD and tenant settings are owner-only
- Adjustment reasons: enum `DAMAGE | COUNT_CORRECTION | RETURN | OTHER`

## Problem

Phase 2 tracks a single `inventory` count per product variant and decrements it when orders are paid. Merchants selling physical goods need warehouse-aware stock management: multiple storage locations, auditable adjustments, replenishment via purchase orders, and visibility into low-stock risk — without leaving the merchant portal or breaking the storefront checkout flow.

## Users

| Persona | Goals |
|---------|-------|
| Merchant Owner | Configure warehouses, set reorder thresholds, review stock health and purchase activity |
| Merchant Staff (inventory role) | Record adjustments, create and receive purchase orders, monitor low-stock alerts |
| Merchant Staff (catalog) | See accurate sellable quantity when editing products |
| End Customer | Continue to see accurate availability and complete checkout (unchanged UX) |
| Platform Super Admin | Optional cross-tenant visibility for support (read-only) |

## Dependencies

- Phase 1 complete: tenant isolation, merchant auth, RBAC
- Phase 2 complete: `ProductVariant.inventory`, catalog CRUD, checkout inventory decrement on `PAID` orders
- Phase 3 must preserve storefront behavior: checkout rejects oversell and decrements stock on payment success

## User Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-3.1 | As a merchant owner, I want to manage warehouses/locations so that stock is organized by physical site | P0 | Given merchant auth, When I create a warehouse with name and optional address, Then it is saved tenant-scoped. When I mark one warehouse as default, Then exactly one default exists per tenant and new stock operations use it unless specified. |
| US-3.2 | As a merchant staff, I want stock levels per variant per warehouse so that I know quantity on hand at each location | P0 | Given a variant and warehouse, When I view stock levels, Then I see quantity on hand per warehouse. Given existing Phase 2 variant `inventory`, When Phase 3 is enabled, Then legacy counts migrate to the tenant default warehouse without data loss. |
| US-3.3 | As a merchant staff, I want to record stock adjustments so that corrections are auditable | P0 | Given a variant at a warehouse with quantity N, When I submit an adjustment (increase or decrease) with reason and optional note, Then on-hand quantity updates and an adjustment record is created with actor, timestamp, before/after quantities, and reason. Given a decrease that would go below zero, Then the adjustment is rejected with a clear error. |
| US-3.4 | As a merchant owner, I want low-stock alerts so that I can reorder before stockouts | P0 | Given a variant with reorder threshold T and on-hand Q at default warehouse, When Q ≤ T, Then the variant appears on the low-stock alerts list. Given Q > T after replenishment, Then it is removed from the list. |
| US-3.5 | As a merchant staff, I want to create basic purchase orders so that I can plan inbound stock | P0 | Given merchant auth, When I create a PO with supplier name (free text), target warehouse, and line items (variant + ordered qty), Then PO status is DRAFT or ORDERED (merchant-selectable). Given invalid variant or warehouse, Then creation fails tenant-scoped validation. |
| US-3.6 | As a merchant staff, I want to receive goods against a purchase order so that on-hand stock increases | P0 | Given an ORDERED PO with line item ordered qty O, When I receive quantity R (R ≤ remaining), Then on-hand stock at the PO warehouse increases by R and PO line shows received vs remaining. When all lines fully received, Then PO status becomes RECEIVED. |
| US-3.7 | As a merchant owner, I want inventory reports so that I can review stock position | P0 | Given merchant auth, When I open inventory reports, Then I see current stock by variant/warehouse with totals, and a low-stock summary. Given a date range filter, When I view adjustment history, Then I see adjustments with reason, actor, and quantity delta. |
| US-3.8 | As a customer, I want checkout to respect available stock so that I cannot purchase unavailable items | P0 | Given sellable quantity S (sum on-hand at fulfillable warehouses, defaulting to default warehouse in MVP), When I checkout quantity Q where Q > S, Then checkout is rejected before payment. When order becomes PAID, Then on-hand decrements from the fulfillment warehouse and matches Phase 2 behavior for single-warehouse tenants. |
| US-3.9 | As a merchant owner, I want to set per-variant reorder thresholds so that alerts match my business rules | P1 | Given a variant, When I set reorder threshold T (integer ≥ 0), Then low-stock evaluation uses T. When unset, Then a tenant-level default threshold applies. |
| US-3.10 | As a merchant staff, I want to list and filter purchase orders so that I can track inbound pipeline | P1 | Given multiple POs, When I filter by status (DRAFT, ORDERED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED), Then only matching POs appear. When I open a PO, Then I see header, lines, and receive history. |
| US-3.11 | As a merchant staff, I want to cancel a purchase order that has not been received so that mistakes are reversible | P1 | Given PO status ORDERED with zero received quantity, When I cancel, Then status becomes CANCELLED and it no longer accepts receipts. Given any received quantity > 0, Then cancel is rejected. |
| US-3.12 | As a merchant owner, I want to export inventory report data so that I can share with suppliers or accountants | P1 | Given current stock or adjustment history view, When I export, Then I receive a CSV with the same filtered dataset visible in the UI. |
| US-3.13 | As a platform admin, I want read-only cross-tenant inventory visibility so that I can support merchants | P1 | Given super admin role, When I view a tenant's inventory summary, Then I see warehouses, stock totals, and recent adjustments without write access. All access is audit-logged. |
| US-3.14 | As a merchant staff, I want sellable quantity reflected in catalog so that I do not manually reconcile counts | P1 | Given variant stock across warehouses, When I view or edit a product in catalog, Then displayed sellable quantity matches aggregated fulfillable on-hand (same number used by storefront). |
| US-3.15 | As a merchant staff, I want to transfer stock between warehouses so that I can rebalance locations | P2 | Given warehouse A with qty QA and warehouse B, When I transfer quantity T (T ≤ QA), Then A decreases by T, B increases by T, and a transfer record is created. |
| US-3.16 | As a merchant owner, I want financial GL and COGS reporting so that I can close books | P2 | Deferred — see Non-Goals. |
| US-3.17 | As a merchant owner, I want multi-level distributor hierarchies so that I can model upline/downline commission | P2 | Deferred — see Non-Goals. |
| US-3.18 | As a merchant owner, I want analytics dashboards with revenue and margin trends so that I can run the business | P2 | Deferred — basic inventory reports only in this iteration; full analytics dashboards later. |

## Non-Goals

- **Advanced distributor hierarchies** — multi-level trees, override commission splits (Phase 4+)
- **Full general ledger / chart of accounts** — journal entries, period close, tax reporting
- **Complex multi-warehouse fulfillment rules** — allocate checkout line to nearest warehouse, split shipments across sites (MVP: default warehouse fulfillment only)
- **Inter-warehouse transfers** — listed as P2; not required for MVP ship
- **Lot/batch tracking, expiry dates, serial numbers**
- **Barcode/QR scanning at receive or pick**
- **Supplier master with payment terms** — MVP uses free-text supplier name on PO
- **PO approval workflows** — single-step create/receive sufficient for MVP
- **Automated reorder / integration with external ERP**
- **Customer-facing back-in-stock notifications**
- **Platform-wide financial analytics dashboards** — inventory-focused reports only

## Success Metrics

| Metric | Target |
|--------|--------|
| Stock accuracy after migration | 100% of Phase 2 variant counts preserved at default warehouse |
| Checkout oversell prevention | 0 successful PAID orders when requested qty > sellable qty |
| Adjustment audit completeness | 100% of manual stock changes have reason + actor + timestamp |
| Low-stock alert latency | Alert list reflects threshold breach within 1 min of quantity change |
| PO receive correctness | Received qty never exceeds ordered qty; stock increment matches receive qty |
| API p95 (inventory CRUD) | < 400ms on local Docker stack |
| P0 test coverage | 100% of P0 acceptance criteria mapped to automated tests |

## Open Questions (resolved)

| # | Question | Decision | Status |
|---|----------|----------|--------|
| 1 | `ProductVariant.inventory` vs warehouse stock | Cached aggregate synced on every movement; migration copies legacy counts to default warehouse | ✅ |
| 2 | Fulfillable warehouses for checkout (MVP) | Default warehouse only; no multi-warehouse allocation | ✅ |
| 3 | PO status enum and transitions | `DRAFT → ORDERED → PARTIALLY_RECEIVED → RECEIVED`; `CANCELLED` from DRAFT/ORDERED if zero received | ✅ |
| 4 | Adjustment reason codes | Fixed enum + optional note | ✅ |
| 5 | RBAC for inventory | Staff: adjust + PO; Owner: warehouse CRUD + settings | ✅ |
| 6 | Negative stock policy | Hard block on adjustments and checkout | ✅ |
| 7 | Partial PO receive | Event model (`PurchaseOrderReceipt`); multiple receives per line | ✅ |
| 8 | Platform admin inventory access | Read-only summary, adjustments, and PO list | ✅ |
| 9 | Low-stock default threshold | Tenant-wide default (default: 5) via `TenantInventorySettings` | ✅ |
| 10 | Commission / order flow impact | Single decrement on PAID; idempotent via `InventoryService` | ✅ |

## Related Documents

| Document | Path |
|----------|------|
| Platform overview | `docs/prd/platform-overview.md` |
| Phase 1 PRD | `docs/prd/phase-1-foundation.md` |
| Phase 2 PRD | `docs/prd/phase-2-ecommerce.md` |
| Platform spec | `docs/superpowers/specs/2025-06-24-meridianerp-platform-design.md` |
| Phase 3 architecture | `docs/architecture/phase-3-inventory.md` |
| Phase 3 design | `docs/design/phase-3-inventory.md` |
| Verification handoff | `docs/handoffs/phase-3-inventory-verification.md` |
