# Handoff: Phase 3 Inventory — UI Design

**Agent:** ui-designer  
**Date:** 2025-06-24  
**Branch:** feature/phase-3-inventory (from develop)

## Scope

Phase 3 (UI spec) complete. Screen specifications, ASCII wireframes, shadcn component mapping, badge variants, nav structure, and catalog integration note documented for merchant inventory workflows and admin read-only tenant support view.

**Deliverables:**

- 9 merchant inventory routes (+ PO new/detail sub-routes)
- 1 admin support route (`/inventory/tenants/[tenantId]`)
- Catalog product Sheet: read-only sellable quantity with link to inventory
- Figma frames deferred — markdown wireframes authoritative until implementation sync

## Files

| Path | Action |
|------|--------|
| `docs/design/phase-3-inventory.md` | Created — full UI spec |
| `docs/handoffs/phase-3-inventory-design.md` | Created |

**Not modified (implementation phase):** `apps/merchant`, `apps/admin`, `packages/ui` shells, Figma file.

## Screen list

### Merchant (`apps/merchant`)

| Route | Purpose | Priority |
|-------|---------|----------|
| `/inventory/warehouses` | Warehouse list + create/edit dialog | P0 |
| `/inventory/stock` | Stock levels table, warehouse filter, reorder threshold (owner) | P0 |
| `/inventory/adjustments` | Adjustment form + history table | P0 |
| `/inventory/alerts` | Low-stock list with quick actions | P0 |
| `/inventory/purchase-orders` | PO list with status filter | P0 |
| `/inventory/purchase-orders/new` | Create PO (draft or ordered) | P0 |
| `/inventory/purchase-orders/[id]` | PO detail, receive dialog, cancel | P0 |
| `/inventory/reports` | Stock summary + adjustment history tabs, CSV export | P0/P1 |
| `/inventory/settings` | Tenant default reorder threshold (owner) | P1 |
| `/catalog/products` | Sellable qty read-only in existing Sheet | P1 |

### Admin (`apps/admin`)

| Route | Purpose | Priority |
|-------|---------|----------|
| `/inventory/tenants/[tenantId]` | Read-only metrics, warehouses, recent adjustments/POs | P1 |

## Component mapping summary

| Domain UI | shadcn primitives |
|-----------|-------------------|
| All list pages | `Table`, `Skeleton`, `DropdownMenu`, pagination |
| Warehouses | `Dialog`, `Form`, `Switch`, `Badge` |
| Stock / reports | `Select`, `Input`, `Tabs`, `MetricCard` |
| Adjustments | `Card`, `Combobox`, `RadioGroup`, `Textarea`, `Alert`, date `Popover` |
| Purchase orders | `Form`, `Combobox`, `AlertDialog`, `Badge` (status) |
| Receive flow | `Dialog`, numeric `Input` per line |
| Reports export | `Button` + `IconDownload`, `Tabs` |
| Catalog integration | Disabled `Input` or static text + `Tooltip` |
| Admin summary | `MetricCard`, `Tabs`, `Alert` (read-only banner) |

**New badge wrappers (recommended):** `PurchaseOrderStatusBadge`, `StockAdjustmentReasonBadge`, `LowStockStatusBadge`.

**Shell:** Extend `MerchantShell` with Inventory nav group; deep link from admin merchant detail to inventory summary.

## Design decisions

| Decision | Choice |
|----------|--------|
| Warehouse CRUD UI | `Dialog` (owner-only writes) |
| PO create | Full page at `/new` + detail at `/[id]` |
| Receive | `Dialog` on PO detail |
| Adjustments layout | Form card above history table on same page |
| Sellable qty in catalog | Read-only; remove from save payload |
| Admin inventory | Tabbed read-only view; no platform write actions |
| Figma | TBD — sync after first implemented screen |

## Open questions

None — architecture ADRs and PRD resolved. RBAC reflected in UI (owner-only warehouse/settings/threshold; staff read warehouses).

## Next agent

**nextjs-frontend** — Implement routes per `docs/design/phase-3-inventory.md`, extend `MerchantShell` nav, update `ProductsTable` sellable field, build admin tenant inventory page. Coordinate with **nestjs-backend** on `@meridian/shared` inventory types and API paths.

**Optional follow-up:** ui-designer to push implemented screens to Figma via `figma-generate-design` and backfill node IDs in design doc.
