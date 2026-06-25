# Bento UI Redesign — Test Report

**Date:** 2025-06-25  
**PRD:** `docs/prd/bento-ui-redesign.md`

## Build verification

| App | Result |
|-----|--------|
| `@meridian/shared` | Pass |
| `@meridian/ui` | Pass (tsc) |
| `@meridian/admin` | Pass |
| `@meridian/merchant` | Pass |
| `@meridian/store` | Pass |
| `@meridian/distributor` | Pass |

## API e2e (extended / new)

| Test file | Coverage |
|-----------|----------|
| `platform-dashboard.e2e-spec.ts` | Extended fields: `ordersLast30Days`, `orderRevenueLast30Days`, `commissionSettledLast30Days`, `trend[]` |
| `gaps-wave1.e2e-spec.ts` | Merchant dashboard extended KPIs + `trend` |
| `distributor-portal.e2e-spec.ts` | `DistributorDashboard.trend` |
| `store-stores.e2e-spec.ts` | **New** — `GET /store/stores` APPROVED filter |

Run: `rtk pnpm --filter @meridian/api test:e2e`

## P0 acceptance mapping

| Story | Status |
|-------|--------|
| US-B1 Bento primitives in ui-spec | Showcase section `#bento-grid` |
| US-B2 Single dashboard API call | Admin/merchant/distributor SSR uses one `GET */dashboard` |
| US-B3 Store picker US-5.1 | `apps/store/app/page.tsx` + `GET /store/stores` |
| US-B4 List skeleton/EmptyState | Applied across list pages via subagent pass |
| US-B5 DistributorShell | `DistributorShell` + wrapper |

## Manual smoke (recommended)

1. `rtk pnpm dev` → Admin `/` Bento dashboard + chart
2. Store `/` → pick store → `/s/demo`
3. Distributor `/` → Bento metrics + chart with locale/theme toggles
4. Merchant `/` → extended KPIs + trend

## Handoff

- **Scope:** Bento UI full-portal redesign + API extensions + tests
- **Docs:** `docs/prd/bento-ui-redesign.md`, `docs/architecture/bento-ui-redesign.md`, `docs/design/bento-ui-redesign.md`
- **Next:** PR to `develop`; optional Playwright smoke for store picker
