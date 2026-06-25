# Handoff: Phase 4 Slice 3 (US-4.2 / US-4.3) — Architecture

**Agent:** architect  
**Date:** 2025-06-25  
**Branch:** `feature/phase-4-distributor-enhancements` (from `develop`)  
**Depends on:** Slices 1–2 shipped (store bind, QR management)

## Scope

Architecture for **merchant visibility** — per-distributor performance dashboard and tenant-wide commission statements.

**Stories:**

- **US-4.2** — Distributor performance tab: bindings (MERCHANT/CUSTOMER), attributed PAID orders, revenue, commission (ACCRUED + SETTLED), date range + daily trend
- **US-4.3** — Commission statements page: line items, distributor filter, running total, SETTLED batch reference

**Locked decisions:**

- Platform `SETTLED` only for payout visibility — no merchant-local paid flag
- Compute-on-read aggregates; optional Redis 5 min cache documented
- Default date window: 30 days
- Commission rate/type from live `Distributor` join (staleness documented)
- RBAC: owner + staff read-only

## Files

| Path | Action |
|------|--------|
| `docs/architecture/phase-4-distributor-slice3.md` | Created — full Slice 3 spec |
| `docs/handoffs/phase-4-distributor-slice3-architecture.md` | Created |
| `packages/shared/src/distributors.ts` | Extended — `orderReference`, `settlementBatchPeriod`, `CommissionListResponse`, `PerformanceTrendPoint`, `commissionTotal`, query types |

## Endpoints

| Method | Path | Auth | RBAC |
|--------|------|------|------|
| `GET` | `/api/v1/merchant/distributors/:id/performance` | Merchant JWT | Owner + Staff |
| `GET` | `/api/v1/merchant/commissions` | Merchant JWT | Owner + Staff |
| `GET` | `/api/v1/merchant/commissions/summary` | Merchant JWT | Owner + Staff |

## Prisma migration (recommended)

```bash
rtk pnpm --filter @meridian/api prisma:migrate -- --name commission_performance_indexes
```

```sql
CREATE INDEX "CommissionLedger_tenantId_createdAt_idx"
  ON "CommissionLedger"("tenantId", "createdAt");
CREATE INDEX "CommissionLedger_tenantId_distributorId_status_idx"
  ON "CommissionLedger"("tenantId", "distributorId", "status");
CREATE INDEX "Binding_tenantId_distributorId_boundAt_idx"
  ON "Binding"("tenantId", "distributorId", "boundAt");
CREATE INDEX "Order_tenantId_distributorId_status_createdAt_idx"
  ON "Order"("tenantId", "distributorId", "status", "createdAt");
```

Additive indexes only — no data migration.

---

## Implementation checklist — Backend (`nestjs-backend`)

- [ ] Migration: composite indexes on `CommissionLedger`, `Binding`, `Order`
- [ ] `apps/api/src/common/date-range.ts` — `parseDateRangeQuery()` with 30-day default
- [ ] `merchant/commissions/dto/commission-list-query.dto.ts` — page, limit, distributorId, status, from, to
- [ ] `merchant/commissions/dto/commission-summary-query.dto.ts` — same filters minus pagination
- [ ] `merchant/distributors/dto/distributor-performance-query.dto.ts` — from, to
- [ ] `CommissionsService.list()` — paginated ledger query with joins; map `CommissionStatementRow`
- [ ] `CommissionsService.summary()` — parallel `SUM` by status + `COUNT`
- [ ] `CommissionsController` — `GET /merchant/commissions`, `GET /merchant/commissions/summary`
- [ ] `CommissionsModule` — register in `MerchantModule`
- [ ] `DistributorsService.getPerformance()` — parallel aggregates + daily trend fill
- [ ] `DistributorsController` — `GET :id/performance` (declare before `GET :id`)
- [ ] Row mapper helpers — `orderReference` (last 8 of orderId), `settlementBatchPeriod` from batch dates
- [ ] Exclude `VOID` ledger rows from default merchant queries
- [ ] `mock-prisma.ts` — commission ledger seed helpers if missing
- [ ] E2E `commissions.e2e-spec.ts` — performance metrics, list filters, summary totals, staff 200, wrong-tenant 404

---

## Implementation checklist — Frontend (`nextjs-frontend`)

- [ ] `apps/merchant/lib/commissions.ts` — `fetchCommissions()`, `fetchCommissionSummary()`, `fetchDistributorPerformance()`, query builders
- [ ] `distributor-tabs.tsx` — Tabs: Overview | Performance on `/distributors/[id]`
- [ ] `performance-panel.tsx` — date presets (7d/30d/90d), KPI stat cards, trend chart (recharts or simple bars), zero-state copy
- [ ] Refactor `distributor-detail.tsx` — move QR/bindings to Overview tab; mount Performance tab
- [ ] `app/commissions/page.tsx` — `ListPageFrame` with summary cards + table
- [ ] `commissions-filters.tsx` — distributor select, status filter, date range
- [ ] `commissions-summary-cards.tsx` — accrued / settled / total from summary API
- [ ] `commissions-table.tsx` — columns: date, order ref (link to `/orders/[id]` when exists), distributor, order total, rate, amount, status `Badge`, batch period
- [ ] `MerchantShell` nav — add `/commissions` link
- [ ] Empty states — US-4.3 copy when no ledger entries; US-4.2 zeros not errors
- [ ] Staff UX — same read access as owner (no disabled controls needed)

---

## Test mapping

| US | Criterion | Test |
|----|-----------|------|
| US-4.2 | Bindings split MERCHANT/CUSTOMER | E2E performance after mixed binds |
| US-4.2 | Attributed order count + revenue | E2E seed PAID orders |
| US-4.2 | Commission ACCRUED + SETTLED | E2E ledger aggregates |
| US-4.2 | Date range updates metrics | E2E with `from`/`to` params |
| US-4.2 | Zero-state | E2E inactive distributor → zeros |
| US-4.3 | Line items with all fields | E2E commission list |
| US-4.3 | Distributor filter + running total | E2E summary with `distributorId` |
| US-4.3 | SETTLED batch reference | E2E linked `SettlementBatch` |
| US-4.3 | Empty state | Playwright `/commissions` no data |

---

## Open questions

None — PRD #3 (merchant paid flag) and #5 (dashboard placement) resolved in parent architecture.

## Next agents

1. **ui-designer** — performance tab + commissions page wireframes mapped to ui-spec (optional if implementers use architecture UI table)
2. **nestjs-backend** — indexes + commissions module + performance endpoint
3. **nextjs-frontend** — performance tab + `/commissions` page (parallel after shared types frozen)
4. **test-engineer** — map US-4.2 / US-4.3 P0 criteria after implementation
