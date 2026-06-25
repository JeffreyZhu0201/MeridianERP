# Handoff: Phase 4 Slice 4 (US-4.5) — Frontend

**Agent:** nextjs-frontend  
**Date:** 2025-06-25  
**Branch:** `feature/phase-4-distributor-enhancements` (from `develop`)  
**Depends on:** Slice 4 backend (`GET /platform/dashboard`, enriched `GET /platform/merchants/:id`)

## Scope

Platform admin UI for live distributor channel metrics (G-3 / G-4).

| Story | Deliverable |
|-------|-------------|
| **US-4.5** | Dashboard — 5 live metric cards incl. commission accrued (30d) |
| **US-4.5** | Dashboard — error alert on API failure; **no hardcoded-zero fallback** |
| **US-4.5** | Merchant detail — always-visible CRM summary + distributors table with binding/order metrics |
| **US-4.5** | Types aligned with `@meridian/shared` (`PlatformDashboardStats`, `PlatformMerchantDetail`) |

## Files

| Path | Action |
|------|--------|
| `apps/admin/lib/api.ts` | Updated — type aliases from `@meridian/shared`; removed duplicate `DashboardStats` / `MerchantDetail` shapes |
| `apps/admin/app/page.tsx` | Updated — removed G-3 zero fallback; 5-card grid; destructive error banner; `formatMoney` for commission |
| `apps/admin/app/merchants/[id]/_components/merchant-detail.tsx` | Updated — CRM card always shown; distributors section with metric columns + empty state; `Badge` status |
| `packages/shared` | Rebuilt (`pnpm --filter @meridian/shared build`) so `PlatformMerchantDetail` / `PlatformRecentMerchant` resolve in admin |

## Ui-spec refs

| Surface | Showcase pattern |
|---------|------------------|
| Dashboard metrics | `MetricCard` grid (merchant dashboard / inventory summary pattern) |
| Dashboard error | Destructive bordered alert (`border-destructive/30 bg-destructive/10`) — same as rejection reason card |
| Merchant detail CRM | `Card` + stat grid (merchant home dashboard CRM-style counts) |
| Distributors table | `Table` + `Badge` (Badges + Table sections in `apps/ui-spec/src/app/page.tsx`) |
| Empty distributors | Dashed border empty state (list empty-state pattern) |

## API wiring

- `GET /api/v1/platform/dashboard` → `PlatformDashboardStats`
  - `commissionAccruedLast30Days` formatted as USD currency on card
- `GET /api/v1/platform/merchants/:id` → `PlatformMerchantDetail`
  - `crmSummary` — contacts / companies / leads (zeros when empty)
  - `distributors[]` — `bindingCount`, `bindingsLast30Days`, `attributedOrdersLast30Days`

## G-3 fix

**Before:** `loadDashboard` caught API errors and synthesized `activeDistributors: 0` / `bindingsLast30Days: 0` from merchant list fallback.

**After:** On failure, renders `role="alert"` error banner with API message; metrics and recent merchants hidden until live data loads.

## Empty / zero states

- CRM summary shows `0` counts when tenant has no CRM entities
- Distributors section always visible; dashed empty copy when `distributors.length === 0`

## RBAC

No UI changes — platform JWT required (existing admin middleware).

## Open questions

None for frontend. Backend must ship `PlatformDashboardModule` and enriched merchant detail for live data.

## Next agent

**test-engineer** — map US-4.5 P0: dashboard e2e metrics, merchant detail enrichment, admin error UI (no synthetic zeros on API 500).
