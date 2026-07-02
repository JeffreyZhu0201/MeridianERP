# Bento Grid UI Redesign — Architecture

**Version:** 1.0  
**Last updated:** 2025-06-25  
**Status:** Implemented; retained as UI architecture reference  
**PRD:** `docs/prd/bento-ui-redesign.md` (US-B1–US-B5)  
**Depends on:** Phase 1–4 portals, `packages/ui`, platform dashboard (Slice 4), distributor performance trend (Slice 3)

## Overview

This initiative delivers a **Bento Grid layout system** in `@meridian/ui` and **extends existing dashboard APIs** so each portal home loads KPIs, charts, and activity feeds in a **single SSR fetch**. A new public store-picker endpoint powers US-5.1 at `apps/store` `/`.

| Story | Deliverable |
|-------|-------------|
| **US-B1** | Bento primitives in ui-spec → `packages/ui` (`BentoGrid`, tiles, chart wrapper) |
| **US-B2** | Extend `GET */dashboard` with 30-day KPIs + `trend[]` (admin, merchant, distributor) |
| **US-B3** | `GET /store/stores` — public list of APPROVED tenants for store picker |
| **US-B4** | List pages use `ListPageFrame` + `Skeleton` / `EmptyState` consistently |
| **US-B5** | `DistributorShell` — sidebar nav, locale + theme toggles |

**Locked decisions:**

| Topic | Decision |
|-------|----------|
| Dashboard API shape | **Extend** existing `GET */dashboard` responses — no parallel chart endpoints |
| Store visibility | **`onboardingStatus = APPROVED`** only; no `storePublished` flag in Slice 1 |
| Trend window | Fixed **30 days** (`DEFAULT_COMMISSION_WINDOW_DAYS`); not user-configurable on home dashboards |
| Trend buckets | Daily UTC buckets with zero-fill (reuse Slice 3 pattern) |
| Chart library | **recharts** in `packages/ui` (copy `chart.tsx` from ui-spec) |
| Redis cache | **P1 — skip for Slice 1**; document keys for follow-up |

Shared contracts: `packages/shared/src/distributors.ts` (platform + trend types), `packages/shared/src/merchant-dashboard.ts`, `packages/shared/src/distributor-portal.ts`, new `packages/shared/src/store.ts`.

---

## Bento Component System (`packages/ui`)

### Workflow

1. Add shared bento examples/components to `packages/ui` (dashboard KPI + chart span-2, list header tiles, detail hero).
2. Copy primitives to `packages/ui/src/components/bento/` and `packages/ui/src/components/ui/chart.tsx` (from ui-spec).
3. Portal pages consume `@meridian/ui` only — never import ui-spec directly.

### Layout model

CSS Grid with explicit span props. Mobile (`< md`) collapses to **1 column**; `colSpan` / `rowSpan` clamp to available columns.

| Token | Value |
|-------|-------|
| Grid gap | `gap-4` |
| Tile surface | `rounded-xl border bg-card ring-1 ring-foreground/10` |
| Tile padding | `p-4` (metric), `p-6` (chart / table) |
| Max grid columns | 4 (dashboard), 4 (list header), 3 (detail hero) |

### Component contracts

#### `BentoGrid`

```typescript
export interface BentoGridProps {
  /** Default 4 for dashboard; 4 for list header; 3 for detail hero */
  columns?: 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}
```

Renders `grid gap-4 grid-cols-1 md:grid-cols-{columns}` with `auto-rows-min`.

#### `BentoTile`

```typescript
export interface BentoTileProps {
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
  /** Optional aria label when tile is interactive */
  'aria-label'?: string;
}
```

Applies `md:col-span-{n}` / `md:row-span-{n}`. Base tile chrome: `rounded-xl border bg-card ring-1 ring-foreground/10`.

#### `BentoMetricTile`

```typescript
export interface BentoMetricTileProps {
  title: string;
  value: React.ReactNode;
  description?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  colSpan?: 1 | 2;
  className?: string;
}
```

Wraps `BentoTile` + label (`text-xs text-muted-foreground`) + value (`text-2xl font-semibold tabular-nums`) + optional delta badge. Replaces ad-hoc `MetricCard` grids on Bento dashboards; `MetricCard` remains for non-Bento list headers.

#### `BentoChartTile`

```typescript
export interface BentoChartTileProps {
  title: string;
  description?: string;
  colSpan?: 2 | 3;
  rowSpan?: 1 | 2;
  /** Pre-shaped recharts data — consumer maps API `trend[]` */
  data: Array<Record<string, string | number>>;
  /** Keys to plot, e.g. ['orderCount', 'orderRevenue'] */
  series: Array<{ key: string; label: string; color?: string }>;
  xKey?: string; // default 'date'
  emptyMessage?: string;
  className?: string;
}
```

Uses `ChartContainer` + recharts `BarChart` or `AreaChart` from `packages/ui/src/components/ui/chart.tsx`. Renders `EmptyState` when `data` is empty or all zeros.

#### `BentoListHeader`

```typescript
export interface BentoListHeaderProps {
  metrics: Array<{
    title: string;
    value: React.ReactNode;
    description?: string;
  }>;
  /** Max 4 tiles; truncates beyond */
  className?: string;
}
```

Composition: `BentoGrid columns={4}` + up to four `BentoMetricTile colSpan={1}`. Sits above `ListPageFrame` children on archetype B pages.

#### `BentoDetailHero`

```typescript
export interface BentoDetailHeroProps {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  metrics?: Array<{ label: string; value: React.ReactNode }>;
  actions?: React.ReactNode;
  className?: string;
}
```

Archetype C: asymmetric hero row — title block `colSpan={2}`, metric tiles `colSpan={1}` each. Feeds into `DetailPageFrame` as top slot.

#### `BentoDashboardFrame`

```typescript
export interface BentoDashboardFrameProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  alert?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
```

Extends `DashboardPageFrame` pattern: `PageHeader` + optional alert + `BentoGrid columns={4}` child slot. Portal dashboard pages replace `DashboardPageFrame` + uniform metric grid with this frame.

#### `DistributorShell`

```typescript
export interface DistributorShellProps {
  children: React.ReactNode;
  distributorName?: string;
  tenantSlug?: string;
  userEmail?: string;
  onLogout?: () => void;
}
```

Renders `ErpShell` with flat nav:

| Route | Label key |
|-------|-----------|
| `/` | dashboard |
| `/commissions` | commissions |

`headerEnd`: `ModeToggle`, `LocaleToggle`, user email, logout — same cluster as `MerchantShell`. App wrapper: `apps/distributor/components/distributor-shell-wrapper.tsx` (thin; passes auth props from layout).

**Dependencies to add** (`packages/ui/package.json`): `recharts@3.8.0` (match ui-spec).

**Exports:** add all Bento components + `ChartContainer` to `packages/ui/src/index.ts`.

---

## API Contracts

Base path: `/api/v1`

### Shared types (`packages/shared`)

#### `DashboardTrendPoint`

Daily bucket for home-dashboard charts (all three portals):

```typescript
export interface DashboardTrendPoint {
  date: string;              // YYYY-MM-DD (UTC)
  orderCount: number;
  orderRevenue: string | number;
  commissionAccrued: string | number;
  commissionSettled?: string | number; // platform + distributor views
}
```

Reuses field names from `PerformanceTrendPoint` (`packages/shared/src/distributors.ts`) for chart mapper compatibility.

#### `StoreListItem` / `StoreListResponse` (`packages/shared/src/store.ts`)

```typescript
export interface StoreListItem {
  slug: string;
  displayName: string;
}

export interface StoreListResponse {
  items: StoreListItem[];
}
```

---

### `GET /store/stores` (new)

| Property | Value |
|----------|-------|
| Auth | **Public** (`@Public()`) |
| Guard | None |
| Controller | `StoreStoresController` @ `store/stores` |

**Response** (`StoreListResponse`):

```typescript
{
  items: Array<{ slug: string; displayName: string }>;
}
```

**Selection rules:**

| Rule | Implementation |
|------|----------------|
| Tenant visible | `MerchantProfile.onboardingStatus = APPROVED` |
| Display name | `MerchantProfile.businessName` |
| Slug | `Tenant.slug` |
| Sort | `businessName ASC` |
| Empty list | `{ items: [] }` — not an error |

**Prisma query** (reference pattern — new method on `StoreStoresService`):

```typescript
prisma.merchantProfile.findMany({
  where: { onboardingStatus: OnboardingStatus.APPROVED },
  orderBy: { businessName: 'asc' },
  select: {
    businessName: true,
    tenant: { select: { slug: true } },
  },
})
// map → { slug: tenant.slug, displayName: businessName }
```

**Errors:** Standard NestJS shape only for server faults; empty catalog is valid.

**Route note:** Register at `store/stores` (no `:slug` param) **before** any `store/:slug/*` catch-all if added later.

---

### `GET /platform/dashboard` (extended)

**Auth:** `PlatformAuthGuard` — `SUPER_ADMIN` | `PLATFORM_OPS`  
**Service:** `PlatformDashboardService.getStats()` — extend in place

**Response** (`PlatformDashboardStats` — extended):

| Field | Type | Notes |
|-------|------|-------|
| `totalMerchants` | `number` | existing |
| `pendingReview` | `number` | existing |
| `activeDistributors` | `number` | existing |
| `bindingsLast30Days` | `number` | existing |
| `commissionAccruedLast30Days` | `string` | existing |
| **`ordersLast30Days`** | `number` | **new** — cross-tenant PAID orders |
| **`orderRevenueLast30Days`** | `string` | **new** — SUM(`Order.total`) same filter |
| **`commissionSettledLast30Days`** | `string` | **new** — SUM ledger ACCRUED→SETTLED in window |
| **`trend`** | `DashboardTrendPoint[]` | **new** — daily buckets, 30 days |
| `recentMerchants` | `PlatformRecentMerchant[]` | existing |

**New Prisma queries** (parallel with existing `Promise.all` in `platform-dashboard.service.ts`):

| Field | Query |
|-------|-------|
| `ordersLast30Days` | `order.count({ where: { status: PAID, createdAt: { gte: windowStart } } })` |
| `orderRevenueLast30Days` | `order.aggregate({ _sum: { total: true }, where: { status: PAID, createdAt: { gte: windowStart } } })` → `decimalSumToString` |
| `commissionSettledLast30Days` | `commissionLedger.aggregate({ _sum: { amount: true }, where: { status: SETTLED, createdAt: { gte: windowStart } } })` |
| `trend` | See **Dashboard aggregation** below — cross-tenant, no `tenantId` / `distributorId` filter |

**Window start:** `dashboardWindowStart()` from `apps/api/src/common/date-range.ts`.

---

### `GET /merchant/dashboard` (extended)

**Auth:** `MerchantAuthGuard` — `tenantId` from JWT  
**Service:** `MerchantDashboardService.getStats()` — extend in place

**Response** (`MerchantDashboardStats` — extended):

| Field | Type | Notes |
|-------|------|-------|
| `businessName` | `string` | existing |
| `contactsCount` | `number` | existing |
| `openLeads` | `number` | existing |
| `activeDistributors` | `number` | existing |
| `recentBindings` | `number` | existing — bindings in 30d window |
| **`ordersLast30Days`** | `number` | **new** — tenant PAID orders in 30d |
| **`revenueLast30Days`** | `string` | **new** — SUM order totals |
| **`commissionAccruedLast30Days`** | `string` | **new** — SUM ledger ACCRUED in 30d |
| **`lowStockCount`** | `number` | **new** — count of variants at/below threshold |
| **`trend`** | `DashboardTrendPoint[]` | **new** — daily buckets, 30d |
| `recentLeads` | `MerchantDashboardLead[]` | existing |
| `recentActivity` | `MerchantDashboardActivity[]` | extended — includes `order.paid` |

**Extended activity type:**

```typescript
export interface MerchantDashboardActivity {
  type: 'binding.created' | 'commission.accrued' | 'order.paid';
  occurredAt: string;
  distributorId?: string;
  distributorName?: string;
  bindType?: string;
  orderId?: string;
  amount?: string;
  orderTotal?: string; // order.paid only
}
```

**New Prisma queries** (add to existing parallel batch in `merchant-dashboard.service.ts`):

| Field | Query |
|-------|-------|
| `ordersLast30Days` | `order.count({ where: { tenantId, status: PAID, createdAt: { gte: windowStart } } })` |
| `revenueLast30Days` | `order.aggregate({ _sum: { total: true }, where: { tenantId, status: PAID, createdAt: { gte: windowStart } } })` |
| `commissionAccruedLast30Days` | `commissionLedger.aggregate({ _sum: { amount: true }, where: { tenantId, status: ACCRUED, createdAt: { gte: windowStart } } })` |
| `lowStockCount` | Delegate to count-only helper — see below |
| `trend` | Dashboard aggregation — scoped to `tenantId` |
| `order.paid` events | `order.findMany({ where: { tenantId, status: PAID, createdAt: { gte: activityStart } }, include: { distributor: { select: { id, name } } }, orderBy: { createdAt: 'desc' } })` merged into `buildRecentActivity` |

**`lowStockCount` implementation:** Extract `countLowStockSkus(tenantId): Promise<number>` from logic in `MerchantInventoryService.lowStockAlerts()` (`apps/api/src/merchant/inventory/merchant-inventory.service.ts`):

1. Load `tenantInventorySettings.defaultReorderThreshold` (default 5).
2. Resolve default warehouse (`isDefault: true`).
3. Count `stockLevel` rows where `quantityOnHand <= (variant.reorderThreshold ?? defaultThreshold)`.

Inject `MerchantInventoryService` or move count into shared `InventoryService` helper to avoid duplicating threshold rules.

**Activity window:** Keep existing **7 days** for `recentActivity` (`RECENT_ACTIVITY_DAYS`); KPI window remains **30 days**.

---

### `GET /distributor/me/dashboard` (extended)

**Auth:** `DistributorAuthGuard`  
**Service:** `DistributorMeService.getDashboard()` — extend in place

**Response** (`DistributorDashboard` — extended):

| Field | Type | Notes |
|-------|------|-------|
| `distributorId` | `string` | existing |
| `distributorName` | `string` | existing |
| `tenantSlug` | `string` | existing |
| `bindingsCount` | `number` | existing |
| `bindingsMerchant` | `number` | existing |
| `bindingsCustomer` | `number` | existing |
| `attributedOrderCount` | `number` | existing |
| `attributedOrderRevenue` | `string \| number` | existing |
| `commissionSummary` | `CommissionSummary` | existing |
| **`trend`** | `DashboardTrendPoint[]` | **new** — daily buckets for scoped distributor |

**Trend query:** Same filters as existing dashboard aggregates in `distributor-me.service.ts` (`tenantId`, `distributorId`, PAID orders, 30d range from `defaultRangeQuery()`). Reuse **`DashboardAggregationHelper.buildOrderTrend`** — identical to `DistributorsService.getPerformance()` trend loop.

---

## Dashboard Aggregation

### Reuse vs new helper

| Approach | Verdict |
|----------|---------|
| Duplicate trend loops in four services | **Reject** — drift risk |
| Raw SQL only | **Reject** — Slice 3 already uses Prisma + in-memory bucket fill |
| **`DashboardAggregationHelper` in `apps/api/src/common/dashboard-aggregation.ts`** | **Accept** |

Extract from `DistributorsService.getPerformance()` (`apps/api/src/merchant/distributors/distributors.service.ts`, lines ~162–192):

```typescript
// apps/api/src/common/dashboard-aggregation.ts
export class DashboardAggregationHelper {
  /** Initialize zero-filled daily buckets */
  static createTrendMap(from: Date, to: Date): Map<string, TrendBucket>;

  /** Fold PAID orders (+ optional commission entry) into buckets */
  static foldOrdersIntoTrend(
    orders: Array<{ createdAt: Date; total: Prisma.Decimal; commissionEntry?: { amount; status } | null }>,
    trendMap: Map<string, TrendBucket>,
  ): void;

  /** Serialize map → DashboardTrendPoint[] sorted by date */
  static serializeTrend(map: Map<string, TrendBucket>): DashboardTrendPoint[];
}
```

Uses existing `eachUtcDay(from, to)` from `apps/api/src/common/date-range.ts`.

### Per-service usage

| Service | Trend scope | Order fetch |
|---------|-------------|-------------|
| `PlatformDashboardService` | Cross-tenant | `order.findMany({ where: { status: PAID, createdAt: { gte, lte } }, select: { createdAt, total, commissionEntry } })` |
| `MerchantDashboardService` | `tenantId` | Same + `tenantId` filter |
| `DistributorMeService` | `tenantId` + `distributorId` | Same as performance panel |
| `DistributorsService.getPerformance` | Refactor to call helper | **No behavior change** — regression test |

**Platform settled series:** Optional second pass — `commissionLedger.findMany({ where: { status: SETTLED, createdAt in range } })` folded by day into `commissionSettled` on each `DashboardTrendPoint`.

---

## Prisma Query Reference

Existing services to extend (do not replace):

| Service | File | Current endpoints |
|---------|------|-------------------|
| `PlatformDashboardService` | `apps/api/src/platform/dashboard/platform-dashboard.service.ts` | `GET /platform/dashboard` |
| `MerchantDashboardService` | `apps/api/src/merchant/dashboard/merchant-dashboard.service.ts` | `GET /merchant/dashboard` |
| `DistributorMeService` | `apps/api/src/distributor/distributor-me.service.ts` | `GET /distributor/me/dashboard` |
| `DistributorsService.getPerformance` | `apps/api/src/merchant/distributors/distributors.service.ts` | `GET /merchant/distributors/:id/performance` (refactor only) |
| `MerchantInventoryService.lowStockAlerts` | `apps/api/src/merchant/inventory/merchant-inventory.service.ts` | Count extraction for `lowStockCount` |

**Shared helpers:**

| Helper | File |
|--------|------|
| `dashboardWindowStart()` | `apps/api/src/common/date-range.ts` |
| `eachUtcDay()` | `apps/api/src/common/date-range.ts` |
| `decimalSumToString()` | `apps/api/src/merchant/commissions/commission-mappers.ts` |
| `DEFAULT_COMMISSION_WINDOW_DAYS` | `packages/shared/src/distributors.ts` |

**No schema migration required** — read-only aggregates on existing `Order`, `CommissionLedger`, `MerchantProfile`, `Tenant`, `StockLevel` models.

---

## Module Boundaries

### NestJS (`apps/api/src/`)

```
store/
  store-stores.controller.ts      # NEW — GET /store/stores @Public()
  store-stores.service.ts         # NEW — APPROVED tenant list
  store.module.ts                 # register controller + service

platform/dashboard/
  platform-dashboard.service.ts   # extend getStats() + trend

merchant/dashboard/
  merchant-dashboard.service.ts   # extend getStats() + trend + order.paid activity

merchant/inventory/
  merchant-inventory.service.ts   # + countLowStockSkus() or export count helper

distributor/
  distributor-me.service.ts       # extend getDashboard() + trend

merchant/distributors/
  distributors.service.ts         # refactor getPerformance trend → helper

common/
  dashboard-aggregation.ts          # NEW — shared trend bucket logic
```

| Module | Change |
|--------|--------|
| `StoreModule` | Add `StoreStoresController`, `StoreStoresService` |
| `PlatformDashboardModule` | Service extension only |
| `MerchantDashboardModule` | Service extension; optional import `MerchantInventoryModule` for low-stock count |
| `DistributorModule` | Service extension only |

### Next.js apps

| App | Feature folder | Bento usage |
|-----|----------------|-------------|
| `apps/admin` | `app/page.tsx` | `BentoDashboardFrame` + `BentoChartTile` + extended platform stats |
| `apps/merchant` | `app/page.tsx` | Full Bento dashboard; list pages → `BentoListHeader` |
| `apps/distributor` | `app/page.tsx`, `components/distributor-shell-wrapper.tsx` | Bento dashboard + **`DistributorShell`** |
| `apps/store` | `app/page.tsx` | Store picker (archetype A-lite); `GET /store/stores` client or SSR |

**Parallel work split:**

1. **Shared contracts first** — extend types in `packages/shared`, then API + UI in parallel.
2. **ui-designer** — map 49 pages to archetypes (PRD matrix) + ui-spec Bento showcase.
3. **Frontend** — Bento primitives + page migrations per portal.
4. **Backend** — store list + dashboard extensions + aggregation helper.

---

## Async Jobs

**None** for this feature. All dashboard data is compute-on-read.

---

## Caching

| Key pattern | TTL | Scope | Slice 1 |
|-------------|-----|-------|---------|
| `platform:dashboard:stats` | 5 min | Cross-tenant aggregates | **Skip (P1)** |
| `tenant:{tenantId}:merchant:dashboard` | 5 min | Merchant home | **Skip (P1)** |
| `distributor:{id}:dashboard` | 5 min | Distributor home | **Skip (P1)** |

**Invalidation (when enabled):** order PAID webhook/job, commission accrue, binding create, stock mutation (merchant low-stock count only).

Document in service comments; implement when load testing warrants — consistent with Slice 3/4 architecture.

---

## ADRs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Store list visibility | **`APPROVED` merchants only** | No `storePublished` column yet; avoids schema churn for US-5.1. Revisit when Phase 5 adds publish flag. |
| Dashboard chart data | **Extend existing `GET */dashboard`** | PRD US-B2 requires single SSR fetch; avoids N+1 chart endpoints and matches Slice 4 extend-don't-recreate pattern. |
| Trend computation | **`DashboardAggregationHelper` + Prisma** | Reuses Slice 3 `eachUtcDay` zero-fill; refactor `getPerformance` to prevent duplication. |
| Chart rendering | **recharts in `packages/ui`** | ui-spec already ships `chart.tsx` + recharts 3.8.0; one library for BentoChartTile and performance panel. |
| Low stock on dashboard | **Count-only via inventory service logic** | Same threshold rules as `/merchant/inventory/alerts/low-stock`; no new alert endpoint. |
| `order.paid` in activity feed | **Extend `MerchantDashboardActivity` union** | Keeps single activity stream; 7-day window unchanged. |
| Redis dashboard cache | **Defer to P1** | Slice 1 prioritizes layout + contracts; cache keys documented for follow-up. |
| Bento vs `MetricCard` | **Both** — Bento on dashboards, `MetricCard` in list headers optional | `BentoListHeader` may wrap `BentoMetricTile`; legacy pages migrate incrementally. |

---

## Migration & Risks

| Risk | Mitigation |
|------|------------|
| Extended DTO breaks strict frontend types | Update `packages/shared` first; portal `api.ts` types import from shared |
| Platform trend query load | Index exists on `Order(status, createdAt)`; monitor; add Redis P1 if needed |
| `getPerformance` refactor regression | Existing e2e in `commissions.e2e-spec.ts` covers trend buckets — run after helper extraction |
| Store list exposes all approved tenants | Accept for MVP; future `storePublished` filter is additive |
| recharts bundle size | Import only in `BentoChartTile` / `chart.tsx`; tree-shake per portal via `@meridian/ui` exports |

---

## Verification

| Check | Command / test |
|-------|----------------|
| Shared types compile | `rtk pnpm --filter @meridian/shared build` |
| API e2e — platform dashboard extended fields | Extend `platform-dashboard.e2e-spec.ts` |
| API e2e — merchant dashboard + lowStockCount | Extend `gaps-wave1.e2e-spec.ts` |
| API e2e — store list public | New `store-stores.e2e-spec.ts` |
| API e2e — distributor trend | Extend distributor dashboard e2e |
| UI — ui-spec Bento showcase | Manual + Playwright smoke |
| Portal homes single fetch | Assert one dashboard API call in SSR for admin, merchant, distributor |

---

## Handoff

- **Scope:** Architecture for Bento UI redesign — component contracts, extended dashboard APIs, store picker endpoint, aggregation helper, module map, ADRs, caching deferral.
- **Files:** `docs/architecture/bento-ui-redesign.md`; shared contract targets: `packages/shared/src/distributors.ts`, `packages/shared/src/merchant-dashboard.ts`, `packages/shared/src/distributor-portal.ts`, `packages/shared/src/store.ts` (new).
- **Open questions:** (1) Platform chart default series — orders vs revenue primary tab? (2) Store picker search — client filter vs server `?q=` (default client-side for Slice 1). (3) `BentoDashboardFrame` vs rename existing `DashboardPageFrame` — recommend keep both during migration.
- **Current reference:** `docs/design/bento-ui-redesign.md` and `packages/ui` contain the shipped UI direction.
