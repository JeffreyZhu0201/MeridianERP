# Phase 3 Inventory — Verification Handoff

## Test Report: Phase 3 Inventory

| Acceptance Criterion | Test file | Status |
|---------------------|-----------|--------|
| US-3.1: Create warehouse tenant-scoped; exactly one default per tenant | `apps/api/test/inventory-warehouses.e2e-spec.ts` | PASS |
| US-3.2: Stock levels per warehouse; legacy inventory migrates to default warehouse | `apps/api/test/inventory-warehouses.e2e-spec.ts` | PASS |
| US-3.3: Auditable adjustments; reject decrease below zero | `apps/api/test/inventory-adjustments.e2e-spec.ts` | PASS |
| US-3.4: Low-stock alerts when Q ≤ T; removed after replenishment | `apps/api/test/inventory-adjustments.e2e-spec.ts` | PASS |
| US-3.5: Create PO (DRAFT/ORDERED); reject invalid variant/warehouse | `apps/api/test/inventory-purchase-orders.e2e-spec.ts` | PASS |
| US-3.6: Receive partial/full; stock increases; RECEIVED when complete | `apps/api/test/inventory-purchase-orders.e2e-spec.ts` | PASS |
| US-3.7: Inventory reports (stock snapshot, adjustment history) | — | NOT COVERED |
| US-3.8: Checkout rejects oversell; decrements stock on PAID | `apps/api/test/store-checkout.e2e-spec.ts` | PASS |

## Summary

| Metric | Value |
|--------|-------|
| New inventory e2e tests | 12 |
| Extended checkout tests (US-3.8) | 2 |
| Total API e2e suite | **38 passed**, 0 failed |
| P0 stories in scope (US-3.1–3.6, 3.8) | **7 / 7 covered** |
| P0 stories overall (incl. US-3.7) | **7 / 8 covered** |

## Test inventory

### `inventory-warehouses.e2e-spec.ts` (4 tests)

- should create warehouse with name and address when merchant owner (US-3.1)
- should ensure exactly one default warehouse per tenant when setting default (US-3.1)
- should show quantity on hand per warehouse when viewing stock levels (US-3.2)
- should migrate legacy variant inventory to default warehouse without data loss (US-3.2)

### `inventory-adjustments.e2e-spec.ts` (4 tests)

- should create adjustment record with audit fields when stock is adjusted (US-3.3)
- should reject decrease adjustment when it would go below zero (US-3.3)
- should include variant on low-stock alerts when quantity is at or below threshold (US-3.4)
- should remove variant from low-stock alerts after replenishment (US-3.4)

### `inventory-purchase-orders.e2e-spec.ts` (4 tests)

- should create purchase order as DRAFT or ORDERED with valid lines (US-3.5)
- should reject creation when variant or warehouse is invalid (US-3.5)
- should increase on-hand stock and update received qty when receiving partial quantity (US-3.6)
- should set status RECEIVED when all lines fully received (US-3.6)

### `store-checkout.e2e-spec.ts` (US-3.8 extensions)

- decrements inventory on paid order — extended to assert `StockLevel.quantityOnHand` sync
- rejects checkout when quantity exceeds sellable stock (US-3.8)

## Gaps / follow-ups

- **US-3.7 (reports):** No e2e coverage for `GET /merchant/inventory/reports/stock` or `GET /merchant/inventory/reports/adjustments`. Recommend a follow-up `inventory-reports.e2e-spec.ts` before merge if 100% P0 coverage is required.
- **Platform read-only (US-3.13, P1):** Out of scope for this verification pass.

## Handoff

- **Scope**: Phase 3 inventory API e2e verification (P0 US-3.1–3.6, US-3.8)
- **Files**:
  - `apps/api/test/inventory-warehouses.e2e-spec.ts`
  - `apps/api/test/inventory-adjustments.e2e-spec.ts`
  - `apps/api/test/inventory-purchase-orders.e2e-spec.ts`
  - `apps/api/test/store-checkout.e2e-spec.ts` (US-3.8)
  - `docs/handoffs/phase-3-inventory-verification.md`
- **Results**: 38 passed, 0 failed
- **Next agent**: devops-engineer (CI/deploy) or implement US-3.7 report tests if full P0 gate required
