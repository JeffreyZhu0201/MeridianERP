# Handoff: Phase 4 Slice 4 (US-4.5) — Architecture

**Agent:** architect  
**Date:** 2025-06-25  
**Branch:** `feature/phase-4-distributor-enhancements` (from `develop`)  
**Depends on:** Slices 1–3 shipped (store bind, QR management, merchant visibility)

## Scope

Architecture for **platform admin distributor metrics** — live dashboard counts and enriched merchant detail (G-3, G-4).

**Stories:**

- **US-4.5** — Admin dashboard: total/active distributors, bindings (30d), commission accrued (30d), recent merchants
- **US-4.5** — Merchant detail: distributor list with `bindingCount`, `bindingsLast30Days`, `attributedOrdersLast30Days`
- **US-4.5** — Merchant detail: `crmSummary` (contacts, companies, leads)
- **US-4.5** — Remove hardcoded-zero fallback when dashboard API fails

**Locked decisions:**

- Compute-on-read; optional Redis 5 min cache deferred
- Fixed 30-day window (`DEFAULT_COMMISSION_WINDOW_DAYS`)
- Commission dashboard metric = ACCRUED ledger only
- `groupBy` batching for per-distributor aggregates (no N+1)
- Error state on API failure — no synthetic zeros

## Files

| Path | Action |
|------|--------|
| `docs/architecture/phase-4-distributor-slice4.md` | Created — full Slice 4 spec |
| `docs/handoffs/phase-4-distributor-slice4-architecture.md` | Created |
| `packages/shared/src/platform.ts` | Extended — `MerchantCrmSummary`, `PlatformMerchantDetail`, `PlatformRecentMerchant` |
| `packages/shared/src/distributors.ts` | Existing — `PlatformDashboardStats`, `MerchantDistributorSummary` (no change) |

## Endpoints

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/api/v1/platform/dashboard` | Platform JWT | `PlatformDashboardStats` |
| `GET` | `/api/v1/platform/merchants/:id` | Platform JWT | `PlatformMerchantDetail` (enriched) |

## Prisma migration

**None required** — Slice 3 indexes sufficient. Optional `Binding.boundAt` index deferred.

---

## Implementation checklist — Backend (`nestjs-backend`)

- [ ] `apps/api/src/platform/dashboard/platform-dashboard.service.ts` — `getStats()` with parallel counts/aggregates
- [ ] `apps/api/src/platform/dashboard/platform-dashboard.controller.ts` — `GET /platform/dashboard`
- [ ] `apps/api/src/platform/dashboard/platform-dashboard.module.ts` — register controller + service
- [ ] `apps/api/src/platform/platform.module.ts` — import `PlatformDashboardModule`
- [ ] Export `startOfUtcDay()` from `apps/api/src/common/date-range.ts` (or duplicate privately in dashboard service)
- [ ] `platform-merchants.service.ts` — refactor `getById()`:
  - [ ] `getCrmSummary(tenantId)` — parallel `crmContact` / `crmCompany` / `crmLead` counts
  - [ ] `getDistributorSummaries(tenantId)` — `groupBy` binding + order aggregates, merge into `MerchantDistributorSummary[]`
  - [ ] `toPlatformMerchantDetail(profile)` — map dates to ISO strings; strip raw Prisma includes
- [ ] Reuse `decimalSumToString()` for `commissionAccruedLast30Days`
- [ ] `mock-prisma.ts` — cross-tenant `count` / `groupBy` / `aggregate` helpers for platform tests
- [ ] E2E `platform-dashboard.e2e-spec.ts`:
  - [ ] Dashboard metrics with seeded distributors, bindings, ledger
  - [ ] 30d window boundary (in-window vs out-of-window rows)
  - [ ] `recentMerchants` limit 5
  - [ ] Merchant detail `crmSummary` + `distributors` enrichment
  - [ ] Empty distributors array
  - [ ] `401` without platform token

---

## Implementation checklist — Frontend (`nextjs-frontend` — admin)

- [ ] `apps/admin/lib/api.ts`:
  - [ ] Import `PlatformDashboardStats`, `PlatformMerchantDetail` from `@meridian/shared`
  - [ ] Add `commissionAccruedLast30Days` to `DashboardStats` (or alias shared type)
  - [ ] Align `MerchantDetail` with `PlatformMerchantDetail` (distributor metric fields)
- [ ] `apps/admin/app/page.tsx`:
  - [ ] Remove `loadDashboard` try/catch fallback that sets `activeDistributors: 0` / `bindingsLast30Days: 0`
  - [ ] On API error: render error alert (destructive border + message) per US-4.5
  - [ ] Add 5th `MetricCard`: "Commission Accrued (30d)" — format currency from API string
  - [ ] Consider `lg:grid-cols-5` or 2-row grid for 5 metrics
- [ ] `apps/admin/app/merchants/[id]/_components/merchant-detail.tsx`:
  - [ ] Always render CRM Summary card (zeros when empty)
  - [ ] Always render Distributors section — table when `length > 0`, empty-state copy when `[]`
  - [ ] Add columns: Total bindings | Bindings (30d) | Orders (30d)
  - [ ] Status column: `Badge` active/inactive (ui-spec Table + Badge)
- [ ] Verify `merchant-detail.tsx` types match enriched API response after backend ships

---

## Test mapping

| US | Criterion | Test |
|----|-----------|------|
| US-4.5 | Live distributor count | E2E dashboard `activeDistributors` |
| US-4.5 | Bindings last 30 days | E2E with dated binding seeds |
| US-4.5 | Commission accrued last 30 days | E2E ACCRUED ledger sum |
| US-4.5 | Merchant detail distributor metrics | E2E enriched `GET …/merchants/:id` |
| US-4.5 | CRM summary populated | E2E CRM entity counts |
| US-4.5 | API unavailable → error, not zeros | Admin page error UI (manual/Playwright) |

---

## Open questions

None — G-3/G-4 scope bounded to read aggregates; SETTLED commission remains in platform settlements module.

## Next agents

1. **nestjs-backend** — `PlatformDashboardModule` + merchant detail enrichment + e2e
2. **nextjs-frontend** (admin) — dashboard metrics + merchant detail table (parallel after API contract)
3. **test-engineer** — map US-4.5 P0 criteria after implementation
