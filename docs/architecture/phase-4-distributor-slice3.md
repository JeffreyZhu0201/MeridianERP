# Phase 4 Slice 3 — Merchant Visibility Architecture

**Version:** 1.0  
**Last updated:** 2025-06-25  
**Status:** Implemented; retained as historical architecture reference  
**PRD:** `docs/prd/phase-4-distributor-enhancements.md` (US-4.2, US-4.3)  
**Depends on:** Slice 1 (store bind + attribution), Slice 2 (QR management) shipped  
**Parent:** `docs/architecture/phase-4-distributor-enhancements.md`

## Overview

Slice 3 delivers **merchant-facing visibility** into distributor channel ROI and commission obligations. Merchants can evaluate per-distributor performance on the distributor detail page and review tenant-wide commission statements with filters and running totals.

| Story | Deliverable |
|-------|-------------|
| **US-4.2** | Per-distributor performance tab — bindings, attributed orders, revenue, commission |
| **US-4.3** | `/commissions` statement list + summary totals, distributor filter, SETTLED batch reference |

**Locked decisions (from parent architecture):**

| Topic | Decision |
|-------|----------|
| Payout visibility | Platform `SETTLED` status only — no merchant-local “paid out” flag |
| Commission rate display | Join live `Distributor` settings at read time (MVP); denormalize on ledger deferred |
| Analytics | Compute-on-read with Prisma aggregates; optional Redis cache (5 min TTL) |
| Date default | Last **30 days** (`DEFAULT_COMMISSION_WINDOW_DAYS`) |
| RBAC | `MERCHANT_OWNER` + `MERCHANT_STAFF` — read-only on all Slice 3 endpoints |

Shared contracts: `packages/shared/src/distributors.ts`.

---

## API Contracts

Base path: `/api/v1`  
Auth: `MerchantAuthGuard` — `tenantId` from JWT scopes all queries.

### Date range parsing (shared helper)

Implement `parseDateRangeQuery(query: DateRangeQuery)` in API (mirror logic in docs; optional shared export later):

| Input | Rule |
|-------|------|
| `from` / `to` omitted | `to = end of today UTC`; `from = to - 30 days` start-of-day |
| `YYYY-MM-DD` | Inclusive UTC day boundary (`00:00:00.000Z` … `23:59:59.999Z`) |
| Full ISO 8601 | Use as-is |
| `from > to` | `400 Bad Request` |

Response echoes resolved `from` / `to` as ISO 8601 strings.

---

### `GET /merchant/distributors/:id/performance`

**RBAC:** Owner + Staff (read).

**Query** (`DistributorPerformanceQuery`):

| Param | Default | Notes |
|-------|---------|-------|
| `from` | today − 30d | ISO date |
| `to` | today | ISO date |

**Response** (`DistributorPerformanceSummary`):

```typescript
{
  distributorId: string;
  distributorName: string;
  bindingsMerchant: number;      // Binding.boundAt in range, bindableType = MERCHANT
  bindingsCustomer: number;      // Binding.boundAt in range, bindableType = CUSTOMER
  attributedOrderCount: number;  // Order.status = PAID, distributorId = :id, createdAt in range
  attributedOrderRevenue: string; // SUM(order.total) same filter
  commissionAccrued: string;     // SUM(ledger.amount) status = ACCRUED, createdAt in range
  commissionSettled: string;     // SUM(ledger.amount) status = SETTLED, createdAt in range
  commissionTotal: string;       // accrued + settled
  from: string;
  to: string;
  trend: PerformanceTrendPoint[]; // daily buckets in range
}
```

**`PerformanceTrendPoint`** — one row per calendar day in `[from, to]`:

```typescript
{
  date: string;           // YYYY-MM-DD
  orderCount: number;
  orderRevenue: string;
  commissionAccrued: string;
}
```

Days with zero activity are included with zeros (stable chart axis).

**Errors:** `404` if distributor not found or wrong tenant.

**Route order:** Register `GET :id/performance` **before** `GET :id` in `DistributorsController`.

---

### `GET /merchant/commissions`

**RBAC:** Owner + Staff (read).

**Query** (`CommissionListQuery`):

| Param | Default | Max | Notes |
|-------|---------|-----|-------|
| `page` | 1 | — | |
| `limit` | 20 | 100 | |
| `distributorId` | — | — | optional filter |
| `status` | — | — | `ACCRUED` \| `SETTLED` |
| `from` | today − 30d | — | ledger `createdAt` |
| `to` | today | — | ledger `createdAt` |

**Response** (`CommissionListResponse`):

```typescript
{
  items: CommissionStatementRow[];
  total: number;
  page: number;
  limit: number;
}
```

**`CommissionStatementRow` mapping:**

| Field | Source |
|-------|--------|
| `id` | `CommissionLedger.id` |
| `orderId` | `CommissionLedger.orderId` |
| `orderReference` | `orderId.slice(-8)` (uppercase) |
| `orderTotal` | `Order.total` |
| `distributorId` / `distributorName` | join `Distributor` |
| `commissionType` / `commissionRate` | join `Distributor` (current settings — document staleness) |
| `amount` | `CommissionLedger.amount` |
| `status` | `CommissionLedger.status` |
| `settlementBatchId` | `CommissionLedger.settlementBatchId` |
| `settlementBatchPeriod` | when batch joined: `` `${periodStart date} — ${periodEnd date}` `` else `null` |
| `createdAt` | `CommissionLedger.createdAt` |

**Sort:** `createdAt DESC`.

**Joins:** `CommissionLedger` → `Order`, `Distributor`, optional `SettlementBatch`.

Exclude `VOID` entries from merchant reads unless `status=VOID` explicitly requested (not exposed in MVP query DTO).

---

### `GET /merchant/commissions/summary`

**RBAC:** Owner + Staff (read).

**Query** (`CommissionSummaryQuery`): same filters as list **without** pagination.

**Response** (`CommissionSummary`):

```typescript
{
  accruedTotal: string;    // SUM amount WHERE status = ACCRUED
  settledTotal: string;    // SUM amount WHERE status = SETTLED
  totalCommission: string; // accruedTotal + settledTotal
  entryCount: number;      // COUNT(*) matching filters
  from: string;
  to: string;
}
```

When `distributorId` filter applied, totals reflect that distributor only (supports US-4.3 running total).

---

## Data Model

### Existing tables (no schema change required for MVP)

| Model | Slice 3 usage |
|-------|---------------|
| `Binding` | Count by `bindableType`, filter `boundAt` + `distributorId` |
| `Order` | PAID orders with `distributorId`, sum `total` |
| `CommissionLedger` | Statement rows + aggregates |
| `SettlementBatch` | Read-only batch period for SETTLED rows |
| `Distributor` | Name + commission settings join |

### Recommended migration (performance indexes)

**Migration name:** `20250625140000_commission_performance_indexes`

```prisma
model CommissionLedger {
  // ... existing fields
  @@index([tenantId, createdAt])
  @@index([tenantId, distributorId, status])
}

model Binding {
  // ... existing fields
  @@index([tenantId, distributorId, boundAt])
}

model Order {
  // ... existing fields
  @@index([tenantId, distributorId, status, createdAt])
}
```

| Risk | Mitigation |
|------|------------|
| Index build on large tables | Non-blocking `CREATE INDEX CONCURRENTLY` in production; standard migrate in dev |
| No functional change | Additive indexes only |

**Deferred:** Denormalize `commissionType` / `commissionRate` onto `CommissionLedger` at accrual time (historical accuracy when distributor rate changes).

---

## Aggregation Strategy (ADR)

**Compute on read** via parallel Prisma queries in service layer:

```
getPerformance(tenantId, distributorId, range):
  Promise.all([
    binding counts (groupBy bindableType),
    order aggregate (count + sum total),
    commission aggregates (groupBy status),
    trend query (raw SQL or Prisma groupBy on date_trunc day),
  ])
```

**Trend query** (PostgreSQL):

```sql
SELECT date_trunc('day', o."createdAt") AS day,
       COUNT(*)::int,
       COALESCE(SUM(o.total), 0),
       COALESCE(SUM(cl.amount) FILTER (WHERE cl.status = 'ACCRUED'), 0)
FROM "Order" o
LEFT JOIN "CommissionLedger" cl ON cl."orderId" = o.id
WHERE o."tenantId" = $1
  AND o."distributorId" = $2
  AND o.status = 'PAID'
  AND o."createdAt" BETWEEN $3 AND $4
GROUP BY 1
ORDER BY 1;
```

Fill missing days in application code for complete `trend` array.

### Optional Redis cache

| Key | TTL | Invalidate on |
|-----|-----|---------------|
| `tenant:{tenantId}:distributor:{id}:perf:{from}:{to}` | 5 min | binding create, order PAID |
| `tenant:{tenantId}:commission:summary:{hash}` | 5 min | commission accrue, settlement batch update |

Skip cache in MVP unless load testing warrants it; document keys for follow-up.

---

## Module Boundaries

### NestJS

```
apps/api/src/
  merchant/
    commissions/
      commissions.module.ts
      commissions.controller.ts    # GET /merchant/commissions, /summary
      commissions.service.ts
      dto/
        commission-list-query.dto.ts
        commission-summary-query.dto.ts
    distributors/
      distributors.controller.ts   # + GET :id/performance
      distributors.service.ts    # + getPerformance()
      dto/
        distributor-performance-query.dto.ts
  commission/                    # existing accrual only — no merchant reads
```

**`MerchantModule` changes:**

- Import `CommissionsModule` (or register controller/service inline).
- `CommissionsService` injects `PrismaService` only — no dependency on `CommissionService` (write path).

**Shared date helper** (optional `apps/api/src/common/date-range.ts`):

```typescript
export function parseDateRangeQuery(
  query: DateRangeQuery,
  defaultDays = DEFAULT_COMMISSION_WINDOW_DAYS,
): { from: Date; to: Date; fromIso: string; toIso: string };
```

### Next.js — `apps/merchant`

| Route | Component | API |
|-------|-----------|-----|
| `/distributors/[id]` | Refactor to tabs: **Overview** (existing QR + bindings), **Performance** (new) | `GET …/performance?from&to` |
| `/commissions` | Statement list page | `GET /merchant/commissions`, `GET …/summary` |

**New files:**

```
apps/merchant/
  app/distributors/[id]/
    _components/distributor-tabs.tsx          # Tabs: Overview | Performance
    _components/performance-panel.tsx         # KPI cards + date range + trend chart
  app/commissions/
    page.tsx
    _components/commissions-table.tsx
    _components/commissions-filters.tsx
    _components/commissions-summary-cards.tsx
  lib/commissions.ts                          # fetch helpers (mirror lib/distributors.ts)
```

**Shell nav** (`packages/ui` `MerchantShell`): add **Commissions** under Distributors group or top-level:

```typescript
{
  key: 'commissions',
  href: '/commissions',
  label: 'Commissions',
  icon: IconCoin, // or IconReceipt
}
```

Place adjacent to Distributors in `mainNav`.

### UI framework mapping

| Screen | Framework | ui-spec reference |
|--------|-----------|-------------------|
| Performance tab | `DetailPageFrame` + stat cards | Dashboard stat grid pattern |
| Commissions list | `ListPageFrame` + `Table` + `Badge` | Table + Badge status variants |
| Date range filter | `Select` or preset buttons (7d / 30d / 90d) | Form controls in showcase |
| Empty states | Muted copy, no infinite spinners | Empty state examples |

---

## RBAC

| Endpoint | MERCHANT_OWNER | MERCHANT_STAFF |
|----------|----------------|----------------|
| `GET …/performance` | ✓ | ✓ |
| `GET /merchant/commissions` | ✓ | ✓ |
| `GET /merchant/commissions/summary` | ✓ | ✓ |

No write operations in Slice 3.

---

## Error Shape

Standard NestJS `{ statusCode, message, error }`.

| Case | Code |
|------|------|
| Distributor not in tenant | `404` |
| Invalid date range | `400` |
| Invalid `status` enum | `400` |

---

## Tests

Extend or add `apps/api/test/commissions.e2e-spec.ts`:

| Case | Assertion |
|------|-----------|
| Seed PAID order + ledger | performance metrics match |
| Date range filter | counts change vs default window |
| Zero activity distributor | all metrics `0`, `trend` filled with zeros |
| Commission list pagination | `total`, `page`, `limit` correct |
| `distributorId` filter | only that distributor's rows |
| `status=SETTLED` | batch period populated when batch linked |
| Summary totals | `accruedTotal` + `settledTotal` = `totalCommission` |
| Staff access | `200` on all three endpoints |
| Wrong tenant distributor | `404` |

**Playwright smoke (merchant):**

- Open distributor → Performance tab → KPI cards render
- Open `/commissions` → table + summary cards
- Apply distributor filter → running total updates

Map to US-4.2 / US-4.3 P0 acceptance criteria.

---

## ADRs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Commission rate source | Live `Distributor` join | No migration; document staleness if rate changed post-order |
| Merchant payout flag | None — `SETTLED` only | Avoid reconciliation drift (PRD #3) |
| Performance placement | Tab on distributor detail | PRD #5 — per-distributor P0 |
| Trend data | Daily buckets in performance response | US-4.2 date-range chart without extra round-trip |
| Bindings in date range | Filter by `boundAt` | Consistent with “metrics in window” |
| Order attribution window | `Order.createdAt` where `status = PAID` | No `paidAt` column; PAID transition is synchronous today |
| VOID ledger rows | Hidden from merchant list | Ops concern; platform settlement owns voids |
| Cache | Optional 5 min Redis | Documented; implement if needed post-MVP |

---

## Implementation Order

1. **Shared types** — extend `packages/shared/src/distributors.ts` (done in architecture pass)
2. **Migration** — composite indexes (non-blocking)
3. **Backend** — `CommissionsModule` + `getPerformance` in parallel
4. **Frontend** — performance tab + commissions page in parallel after API contracts frozen
5. **Tests** — e2e + Playwright smoke

---

## Related Documents

| Document | Path |
|----------|------|
| PRD | `docs/prd/phase-4-distributor-enhancements.md` |
| Parent architecture | `docs/architecture/phase-4-distributor-enhancements.md` |
| Phase 2 commission | `docs/architecture/phase-2-ecommerce.md` |
| Shared contracts | `packages/shared/src/distributors.ts` |
| Slice 2 handoff | `docs/handoffs/phase-4-distributor-slice2-architecture.md` |
