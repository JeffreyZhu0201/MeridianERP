# Handoff: Phase 3 Inventory — Architecture

**Agent:** architect  
**Date:** 2025-06-24  
**Branch:** feature/phase-3-inventory (from develop)

## Scope

Phase 2 (Architecture) complete. Domain model, migration plan, API contracts, checkout integration, async job stub, and shared TypeScript contracts defined. All PRD open questions resolved via ADRs.

**Locked decisions:**

- `ProductVariant.inventory` retained as cached sellable qty (default warehouse on-hand); synced on every movement via `InventoryService`
- MVP storefront fulfillment: default warehouse only
- PO states: DRAFT → ORDERED → PARTIALLY_RECEIVED → RECEIVED; CANCELLED from DRAFT/ORDERED when zero received
- Adjustment reasons: enum + optional note; hard block negative stock
- MERCHANT_STAFF + MERCHANT_OWNER: adjustments and PO create/receive; OWNER-only: warehouses, settings, reorder defaults
- Partial receives via `PurchaseOrderReceipt` events
- Tenant default reorder threshold: 5
- Platform admin: read-only summary + recent adjustments/POs, audit logged

## Files

| Path | Action |
|------|--------|
| `docs/architecture/phase-3-inventory.md` | Created |
| `docs/handoffs/phase-3-inventory-architecture.md` | Created |
| `packages/shared/src/enums.ts` | Added `PurchaseOrderStatus`, `StockAdjustmentReason` |
| `packages/shared/src/inventory.ts` | Created — DTOs and job payload types |
| `packages/shared/src/index.ts` | Re-exports `inventory` |

**Not modified (implementation phase):** `apps/api/prisma/schema.prisma`, NestJS modules, Next.js UI.

## Prisma models (to implement)

| Model | Purpose |
|-------|---------|
| `TenantInventorySettings` | Tenant default reorder threshold |
| `Warehouse` | Storage locations; one `isDefault` per tenant |
| `StockLevel` | Variant × warehouse on-hand qty |
| `StockAdjustment` | Auditable manual corrections |
| `PurchaseOrder` | Inbound order header + status |
| `PurchaseOrderLine` | Variant lines with ordered/received qty |
| `PurchaseOrderReceipt` | Receive event header |
| `PurchaseOrderReceiptLine` | Qty received per line per event |

`ProductVariant`: add `reorderThreshold`; keep `inventory` as cache.

## API surface (summary)

**Merchant** (`/api/v1/merchant/inventory/*`): settings, warehouses, stock-levels, adjustments, low-stock alerts, variant reorder threshold, purchase-orders (CRUD + submit/cancel/receive), reports + CSV export.

**Platform** (`/api/v1/platform/inventory/*`): read-only tenant summary, recent adjustments, recent POs.

**Store** (existing paths): checkout validates/decrements via `InventoryService` + synced cache.

## Migration

1. Add schema + `TenantInventorySettings`, default warehouse per tenant, backfill `StockLevel` from `ProductVariant.inventory`.
2. Deploy `InventoryService`; switch checkout decrement to warehouse-aware path.
3. Verify zero drift between `inventory` and default `StockLevel`.

## Open questions

None — all PRD items resolved in architecture ADRs.

## Next agents

1. **ui-designer** — merchant inventory screens (warehouses, stock, adjustments, POs, reports, low-stock) + admin tenant inventory read-only view; reference `docs/architecture/phase-3-inventory.md` API shapes.
2. **nestjs-backend** + **nextjs-frontend** (parallel after UI spec) — Prisma migration, `InventoryService`, merchant/platform controllers, checkout integration, merchant/admin UI.
