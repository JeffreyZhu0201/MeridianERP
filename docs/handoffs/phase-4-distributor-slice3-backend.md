# Handoff: Phase 4 Slice 3 (US-4.2 / US-4.3) — Backend

**Agent:** nestjs-backend  
**Date:** 2025-06-25  
**Branch:** `feature/phase-4-distributor-enhancements` (from `develop`)

## Scope

Merchant-facing read APIs for distributor performance and commission statements (US-4.2 + US-4.3).

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/merchant/distributors/:id/performance` | Per-distributor KPIs + daily trend |
| `GET` | `/api/v1/merchant/commissions` | Paginated commission statement list |
| `GET` | `/api/v1/merchant/commissions/summary` | Accrued/settled totals + entry count |

### Behavior

- Default date window: last 30 days (`DEFAULT_COMMISSION_WINDOW_DAYS`)
- `parseDateRangeQuery()` — UTC day boundaries for `YYYY-MM-DD`; full ISO passthrough; `400` when `from > to`
- Commission list excludes `VOID` unless `status=VOID` explicitly requested (not in MVP DTO)
- Commission rate/type from live `Distributor` join (staleness documented in architecture)
- Performance trend: daily buckets filled with zeros for stable chart axis
- RBAC: `MERCHANT_OWNER` + `MERCHANT_STAFF` read-only (no new write paths)

## Files

| Path | Action |
|------|--------|
| `apps/api/src/common/date-range.ts` | Created — `parseDateRangeQuery`, `eachUtcDay` |
| `apps/api/src/merchant/commissions/commission-mappers.ts` | Created — row mapping helpers |
| `apps/api/src/merchant/commissions/commissions.service.ts` | Created |
| `apps/api/src/merchant/commissions/commissions.controller.ts` | Created |
| `apps/api/src/merchant/commissions/commissions.module.ts` | Created |
| `apps/api/src/merchant/commissions/dto/*.ts` | Created — list + summary query DTOs |
| `apps/api/src/merchant/distributors/dto/distributor-performance-query.dto.ts` | Created |
| `apps/api/src/merchant/distributors/distributors.service.ts` | Added `getPerformance()` |
| `apps/api/src/merchant/distributors/distributors.controller.ts` | Added `GET :id/performance` (before `GET :id`) |
| `apps/api/src/merchant/merchant.module.ts` | Imports `CommissionsModule` |
| `apps/api/prisma/schema.prisma` | Composite indexes on `CommissionLedger`, `Binding`, `Order` |
| `apps/api/prisma/migrations/20250625140000_commission_performance_indexes/` | Created |
| `apps/api/test/commissions.e2e-spec.ts` | Created — 10 cases, all green |
| `apps/api/test/helpers/mock-prisma.ts` | Extended — count/aggregate, date filters, settlementBatch include |

## Migration

```bash
rtk pnpm --filter @meridian/api prisma:migrate deploy
# or dev:
rtk pnpm --filter @meridian/api prisma:migrate -- --name commission_performance_indexes
```

## Tests

```bash
rtk pnpm --filter @meridian/api test:e2e -- commissions.e2e-spec.ts
```

**Result:** 10/10 passed

| Case | Status |
|------|--------|
| Performance metrics (bindings, orders, commission) | ✓ |
| Date range filter | ✓ |
| Zero-activity distributor | ✓ |
| List pagination | ✓ |
| `distributorId` filter | ✓ |
| `status=SETTLED` + batch period | ✓ |
| Summary totals | ✓ |
| Staff read access | ✓ |
| Wrong-tenant 404 | ✓ |
| Invalid date range 400 | ✓ |

## Open questions

None.

## Next agent

**nextjs-frontend** — performance tab on `/distributors/[id]`, `/commissions` page, `lib/commissions.ts` fetch helpers, shell nav link.

Then **test-engineer** — Playwright smoke for US-4.2 / US-4.3 P0 criteria.
