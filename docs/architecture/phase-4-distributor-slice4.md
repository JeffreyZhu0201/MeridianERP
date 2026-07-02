# Phase 4 Slice 4 — Platform Admin Architecture

**Version:** 1.0  
**Last updated:** 2025-06-25  
**Status:** Implemented; retained as historical architecture reference  
**PRD:** `docs/prd/phase-4-distributor-enhancements.md` (US-4.5)  
**Depends on:** Slices 1–3 shipped (store bind, QR management, merchant visibility)  
**Parent:** `docs/architecture/phase-4-distributor-enhancements.md`

## Overview

Slice 4 closes **platform oversight gaps G-3 and G-4** by delivering live cross-tenant distributor channel metrics on the admin dashboard and enriched distributor summaries on merchant detail.

| Story | Deliverable |
|-------|-------------|
| **US-4.5** | `GET /platform/dashboard` — live distributor, binding, and commission counts |
| **US-4.5** | `GET /platform/merchants/:id` — `distributors[]` with activity metrics + `crmSummary` |
| **US-4.5** | Admin UI — remove hardcoded-zero fallback; show error state when API fails |

**Locked decisions (from parent architecture):**

| Topic | Decision |
|-------|----------|
| Analytics | Compute-on-read with Prisma aggregates; optional Redis cache (5 min TTL) |
| Dashboard window | Fixed **30 days** for binding and commission metrics (not user-configurable) |
| Active distributors | `Distributor.isActive = true` across all tenants |
| Commission metric | `SUM(CommissionLedger.amount)` where `status = ACCRUED` and `createdAt` in last 30d |
| Binding metric | `Binding.boundAt >= now() - 30d` (cross-tenant) |
| CRM summary | Count `CrmContact`, `CrmCompany`, `CrmLead` by `tenantId` |
| Auth | `PlatformAuthGuard` — `SUPER_ADMIN` \| `PLATFORM_OPS` |
| Tenant bypass | Platform queries are cross-tenant; no `@BypassTenant()` audit extension in Slice 4 (read-only aggregates) |

Shared contracts: `packages/shared/src/distributors.ts` (`PlatformDashboardStats`, `MerchantDistributorSummary`), `packages/shared/src/platform.ts` (`MerchantCrmSummary`, `PlatformMerchantDetail`, `PlatformRecentMerchant`).

---

## API Contracts

Base path: `/api/v1`  
Auth: `PlatformAuthGuard` on all endpoints below.

### `GET /platform/dashboard`

**Response** (`PlatformDashboardStats`):

```typescript
{
  totalMerchants: number;           // MerchantProfile count
  pendingReview: number;            // onboardingStatus IN (SUBMITTED, UNDER_REVIEW)
  activeDistributors: number;       // Distributor where isActive = true (all tenants)
  bindingsLast30Days: number;       // Binding where boundAt >= window start
  commissionAccruedLast30Days: string; // SUM(amount) ACCRUED, createdAt in window
  recentMerchants: PlatformRecentMerchant[]; // latest 5 by createdAt desc
}
```

**Computation (parallel `Promise.all`):**

| Field | Prisma query |
|-------|--------------|
| `totalMerchants` | `merchantProfile.count()` |
| `pendingReview` | `merchantProfile.count({ where: { onboardingStatus: { in: ['SUBMITTED','UNDER_REVIEW'] } } })` |
| `activeDistributors` | `distributor.count({ where: { isActive: true } })` |
| `bindingsLast30Days` | `binding.count({ where: { boundAt: { gte: windowStart } } })` |
| `commissionAccruedLast30Days` | `commissionLedger.aggregate({ _sum: { amount: true }, where: { status: ACCRUED, createdAt: { gte: windowStart } } })` |
| `recentMerchants` | `merchantProfile.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id, businessName, contactEmail, onboardingStatus, submittedAt } })` |

**Window start:** `startOfUtcDay(now - 30 days)` — reuse `DEFAULT_COMMISSION_WINDOW_DAYS` from `@meridian/shared` and UTC helpers from `apps/api/src/common/date-range.ts` (`startOfUtcDay` — export if not already).

**Amount serialization:** `commissionAccruedLast30Days` as decimal string via existing `decimalSumToString()` helper (`commission-mappers.ts`).

**Errors:** Standard NestJS shape. No partial response on failure.

---

### `GET /platform/merchants/:id` (enriched)

**Response** (`PlatformMerchantDetail`):

Extends existing profile fields with:

```typescript
{
  // existing profile fields (camelCase, ISO date strings)
  id, businessName, legalName, contactEmail, contactPhone,
  onboardingStatus, rejectionReason, submittedAt, reviewedAt, tenantId,
  crmSummary: { contacts, companies, leads },
  distributors: MerchantDistributorSummary[]
}
```

**`crmSummary`** — parallel counts scoped to `profile.tenantId`:

```typescript
prisma.crmContact.count({ where: { tenantId } })
prisma.crmCompany.count({ where: { tenantId } })
prisma.crmLead.count({ where: { tenantId } })
```

**`distributors`** — per-tenant distributor list with aggregates:

1. `distributor.findMany({ where: { tenantId }, orderBy: { name: 'asc' }, select: { id, name, isActive } })`
2. For each distributor (or batched `groupBy`), compute:

| Field | Source |
|-------|--------|
| `bindingCount` | `binding.count({ distributorId, tenantId })` — all time |
| `bindingsLast30Days` | `binding.count({ distributorId, tenantId, boundAt: { gte: windowStart } })` |
| `attributedOrdersLast30Days` | `order.count({ distributorId, tenantId, status: PAID, createdAt: { gte: windowStart } })` |

**Batching strategy (preferred):**

```typescript
const windowStart = startOfUtcDay(subDays(new Date(), DEFAULT_COMMISSION_WINDOW_DAYS));

const [distributors, bindingTotals, bindingRecent, orderRecent] = await Promise.all([
  prisma.distributor.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
  prisma.binding.groupBy({ by: ['distributorId'], where: { tenantId }, _count: true }),
  prisma.binding.groupBy({ by: ['distributorId'], where: { tenantId, boundAt: { gte: windowStart } }, _count: true }),
  prisma.order.groupBy({ by: ['distributorId'], where: { tenantId, status: PAID, createdAt: { gte: windowStart } }, _count: true }),
]);
// Merge maps by distributorId into MerchantDistributorSummary[]
```

When tenant has **zero distributors**, return `distributors: []` (not omit key).

**404:** Profile not found — unchanged.

**Do not** return raw Prisma `tenant` / `users` includes in the enriched response; map to the contract shape only.

---

## Data Model

**No schema migration required.** Slice 3 indexes support tenant-scoped aggregates:

- `Binding`: `@@index([tenantId, distributorId, boundAt])`
- `CommissionLedger`: `@@index([tenantId, createdAt])`, `@@index([tenantId, distributorId, status])`
- `Order`: `@@index([tenantId, distributorId, status, createdAt])` (from Slice 3 migration)

Optional future index (not blocking Slice 4):

```prisma
@@index([boundAt])  // Binding — platform-wide 30d count at scale
```

---

## Module Boundaries (NestJS)

```
apps/api/src/platform/
  dashboard/
    platform-dashboard.module.ts
    platform-dashboard.controller.ts
    platform-dashboard.service.ts
  merchants/
    platform-merchants.service.ts   # extend getById() → mapPlatformMerchantDetail()
    platform-merchants.controller.ts  # unchanged route; response shape changes
  platform.module.ts              # import PlatformDashboardModule
```

**`PlatformDashboardService`:**

- `getStats(): Promise<PlatformDashboardStats>`
- Private `dashboardWindowStart(): Date`

**`PlatformMerchantsService`:**

- Refactor `getById()` to return `PlatformMerchantDetail` (mapper function `toPlatformMerchantDetail()`)
- Extract `getDistributorSummaries(tenantId)` and `getCrmSummary(tenantId)` as private helpers

---

## Module Boundaries (Next.js — `apps/admin`)

| Route | Change |
|-------|--------|
| `/` (dashboard) | Consume live `PlatformDashboardStats`; add commission metric card; remove zero-fallback on API error |
| `/merchants/[id]` | Render enriched distributor table columns; always show CRM + Distributors sections |

**Files to touch:**

```
apps/admin/
  app/page.tsx                              # error state, commission card
  app/merchants/[id]/_components/merchant-detail.tsx  # distributor metrics columns, empty states
  lib/api.ts                                # align DashboardStats + MerchantDetail with @meridian/shared
```

Import types from `@meridian/shared` where possible instead of duplicating local interfaces.

---

## Caching (optional)

| Key | TTL | Invalidate |
|-----|-----|------------|
| `platform:dashboard:stats` | 5 min | binding create, distributor toggle, commission accrue, merchant approve/reject |
| `platform:merchant:{profileId}:detail` | 5 min | same + CRM CRUD for tenant |

**MVP:** Skip Redis; compute on read. Add cache only if dashboard p95 exceeds 500ms in staging.

---

## Async Jobs

None — Slice 4 is read-only.

---

## RBAC

| Endpoint | SUPER_ADMIN | PLATFORM_OPS |
|----------|-------------|--------------|
| `GET /platform/dashboard` | ✓ | ✓ |
| `GET /platform/merchants/:id` | ✓ | ✓ |

No new roles or guards.

---

## ADRs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dashboard endpoint | New `platform/dashboard` module | Separates cross-tenant aggregates from merchant list |
| Commission dashboard metric | ACCRUED only in 30d window | Matches PRD "commission accrued"; SETTLED visible in settlements module |
| Merchant detail shape | Typed `PlatformMerchantDetail` | Admin UI already expects `crmSummary` / `distributors`; stops raw Prisma leak |
| Distributor aggregates | `groupBy` batching | Avoids N+1 per distributor on tenants with many agents |
| API failure UX | Error banner, no synthetic zeros | US-4.5 acceptance — G-3 hardcoded-zero fallback removed |
| Empty distributors | Show section with zero-state copy | PRD requires visibility when none exist vs silent hide |

---

## Error Shape

Standard NestJS `{ statusCode, message, error }`.

| Case | Code |
|------|------|
| Missing / invalid platform JWT | `401` |
| Merchant profile not found | `404` |

---

## Tests

Add `apps/api/test/platform-dashboard.e2e-spec.ts`:

| Case | Assertion |
|------|-----------|
| Seed 2 tenants, 3 active distributors, 1 inactive | `activeDistributors === 3` |
| Bindings in/out of 30d window | `bindingsLast30Days` counts only in-window |
| ACCRUED ledger in/out of window | `commissionAccruedLast30Days` correct; SETTLED excluded |
| `recentMerchants` | max 5, ordered by `createdAt` desc |
| Merchant detail enrichment | `crmSummary` counts match seeded CRM rows |
| Merchant detail distributors | `bindingCount`, `bindingsLast30Days`, `attributedOrdersLast30Days` per distributor |
| No distributors on tenant | `distributors: []`, `crmSummary` still populated |
| Unauthenticated | `401` on dashboard |

Extend `mock-prisma.ts` with cross-tenant count/aggregate helpers if missing.

**Admin smoke (manual / Playwright):**

- Dashboard loads live metrics (non-zero after seed data)
- Simulate API 500 → error message, not zeros
- Merchant detail shows distributor table with binding/order columns

---

## UI Specification

| Screen | Component | ui-spec reference |
|--------|-----------|-------------------|
| Dashboard metrics | `MetricCard` grid (5 cards) | Stat grid in `apps/ui-spec/src/app/page.tsx` |
| Dashboard error | Destructive alert / bordered error panel | Alert pattern |
| Merchant distributors table | `Table` + `Badge` for active/inactive | Table + Badge variants |
| Empty distributors | Dashed border empty state | Empty state examples |
| CRM summary | Existing 3-column stat grid | Stat cards |

**New dashboard metric:** "Commission Accrued (30d)" — format as currency string from API.

**Distributor table columns:** Name | Status | Total bindings | Bindings (30d) | Orders (30d).

---

## Implementation Order

1. Shared types frozen (`platform.ts` — done in architecture pass)
2. Backend: `PlatformDashboardModule` + enriched `getById`
3. E2E: `platform-dashboard.e2e-spec.ts`
4. Admin frontend: dashboard + merchant detail (parallel after step 2 contract stable)

Slice 4 is **independent** of Slices 2–3 but benefits from Slice 3 indexes for merchant-detail per-distributor aggregates.

---

## Related Documents

| Document | Path |
|----------|------|
| PRD | `docs/prd/phase-4-distributor-enhancements.md` |
| Parent architecture | `docs/architecture/phase-4-distributor-enhancements.md` |
| Slice 3 (merchant visibility) | `docs/architecture/phase-4-distributor-slice3.md` |
| Admin dashboard UI | `apps/admin/app/page.tsx` |
| Admin merchant detail | `apps/admin/app/merchants/[id]/_components/merchant-detail.tsx` |
