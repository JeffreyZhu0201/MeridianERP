# Phase 3 — Inventory Implementation Plan

> **Prerequisite:** Phase 2 complete (storefront, catalog, checkout, commission).

**Goal:** Warehouse-aware stock management — adjustments, purchase orders, low-stock alerts, reports, and platform read-only visibility — while preserving storefront checkout via cached `ProductVariant.inventory`.

**Architecture:** Extend NestJS with `InventoryService`, new Prisma models (`Warehouse`, `StockLevel`, `StockAdjustment`, `PurchaseOrder`, …), merchant inventory APIs, checkout integration, and merchant/admin UI.

**Tech Stack:** Same as Phase 2; no new Docker services.

**Reference docs:** `docs/prd/phase-3-inventory.md`, `docs/architecture/phase-3-inventory.md`, `docs/design/phase-3-inventory.md`

---

## Phase 3 PRD Summary

### User Stories (MVP)

| ID | Story | Priority |
|----|-------|----------|
| US-3.1 | Manage warehouses / default location | P0 |
| US-3.2 | Stock levels per variant per warehouse | P0 |
| US-3.3 | Auditable stock adjustments | P0 |
| US-3.4 | Low-stock alerts | P0 |
| US-3.5 | Create purchase orders | P0 |
| US-3.6 | Receive goods against PO | P0 |
| US-3.7 | Inventory reports + CSV export | P0 |
| US-3.8 | Checkout respects sellable stock | P0 |
| US-3.9–3.14 | Reorder thresholds, PO filters, admin read-only, catalog sellable qty | P1 |

### Non-Goals (Phase 3)

- Inter-warehouse transfers (P2)
- Lot/batch/serial tracking
- Multi-warehouse fulfillment rules
- GL / COGS reporting

---

## Task 1: Phase 3 PRD, Architecture & Design

**Files:**
- `docs/prd/phase-3-inventory.md`
- `docs/architecture/phase-3-inventory.md`
- `docs/design/phase-3-inventory.md`

### Task 1 status: ✅ Complete

- [x] PRD with P0/P1 user stories and acceptance criteria
- [x] Architecture: data model, API contracts, ADRs, checkout integration
- [x] UI spec: merchant inventory routes + admin tenant summary

---

## Task 2: Prisma Schema & Migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: migration `20250624200000_phase3_inventory`

**Models:** `TenantInventorySettings`, `Warehouse`, `StockLevel`, `StockAdjustment`, `PurchaseOrder`, `PurchaseOrderLine`, `PurchaseOrderReceipt`, `PurchaseOrderReceiptLine`

### Task 2 status: ✅ Complete

- [x] Phase 3 enums and models added
- [x] `ProductVariant.reorderThreshold` added; `inventory` retained as sellable cache
- [x] Migration applied

---

## Task 3: Shared Contracts

**Files:**
- `packages/shared/src/enums.ts` — `PurchaseOrderStatus`, `StockAdjustmentReason`
- `packages/shared/src/inventory.ts` — DTOs and job payload types

### Task 3 status: ✅ Complete

- [x] Shared enums and inventory types exported from `@meridian/shared`

---

## Task 4: InventoryService & Backend APIs

**Files:**
- `apps/api/src/inventory/inventory.service.ts`
- `apps/api/src/merchant/inventory/*` — settings, warehouses, stock-levels, adjustments, POs, reports
- `apps/api/src/platform/inventory/*` — read-only tenant summary
- `apps/api/src/queue/inventory-queue.service.ts` — low-stock check stub

### Task 4 status: ✅ Complete

- [x] `InventoryService` — migrate tenant, adjustments, receive, checkout decrement, cache sync
- [x] Merchant `/api/v1/merchant/inventory/*` controllers
- [x] Platform `/api/v1/platform/inventory/*` read-only endpoints
- [x] Checkout wired through `InventoryService` on PAID

---

## Task 5: Merchant Inventory UI

**Files:**
- `apps/merchant/app/inventory/**` — warehouses, stock, adjustments, alerts, POs, reports, settings
- Catalog: read-only sellable qty in product sheet

### Task 5 status: ✅ Complete

- [x] 9 merchant inventory routes per design spec
- [x] `MerchantShell` nav extended with Inventory group

---

## Task 6: Admin Inventory UI

**Files:**
- `apps/admin/app/inventory/tenants/[tenantId]/**`

### Task 6 status: ✅ Complete

- [x] Read-only tenant inventory summary (warehouses, recent adjustments/POs)

---

## Task 7: Seed & Demo Data

**Files:**
- `apps/api/prisma/seed.ts`

### Task 7 status: ✅ Complete

- [x] `seedTenantInventory()` — default warehouse, `TenantInventorySettings`, `StockLevel` backfill from variant `inventory`
- [x] Demo tenant (`demo`) seeds with Default Warehouse and 100 units on `DEMO-001`

---

## Task 8: CI & Build Verification

**Files:**
- `.github/workflows/ci.yml` (unchanged — no new services)

**Pipeline:** `pnpm install` → shared build → Prisma generate → API e2e (25 tests) → `pnpm build`

### Task 8 status: ✅ Complete

- [x] CI workflow valid for Phase 3 (no Docker/compose changes required)
- [x] API e2e: 8 suites, 25 tests passing (mock Prisma)
- [x] Full monorepo build green (admin, merchant, store, api)

---

## Execution Order

1. PRD + architecture + design (Task 1)
2. Schema + migration (Task 2)
3. Shared contracts (Task 3)
4. Backend `InventoryService` + APIs (Task 4)
5. Merchant UI (Task 5) + Admin UI (Task 6) — parallel after API contracts
6. Seed demo inventory (Task 7)
7. CI verification (Task 8)

---

**Phase 3: COMPLETE**

Plan saved. Ship via PR `feature/phase-3-inventory` → `develop` per `docs/execution/git-workflow.md`.
