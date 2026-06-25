# Handoff: Phase 4 Slice 3 (US-4.2 / US-4.3) — Frontend

**Agent:** nextjs-frontend  
**Date:** 2025-06-25  
**Branch:** `feature/phase-4-distributor-enhancements` (from `develop`)  
**Depends on:** Slice 3 backend (`GET /merchant/commissions`, `/summary`, `/distributors/:id/performance`)

## Scope

Merchant-facing visibility for distributor performance and commission statements.

| Story | Deliverable |
|-------|-------------|
| **US-4.2** | Distributor detail **Performance** tab — KPI cards, 7d/30d/90d presets, daily commission bar trend |
| **US-4.3** | `/commissions` page — `ListPageFrame`, summary cards, filters, statement table |

## Files

| Path | Action |
|------|--------|
| `apps/merchant/lib/commissions.ts` | Created — `fetchCommissions`, `fetchCommissionSummary`, `fetchDistributorPerformance`, query builders, date presets |
| `apps/merchant/app/commissions/page.tsx` | Created — server page with `searchParams` filters |
| `apps/merchant/app/commissions/_components/commissions-filters.tsx` | Created — distributor, status, date range (URL-driven) |
| `apps/merchant/app/commissions/_components/commissions-summary-cards.tsx` | Created — accrued / settled / total / entry count |
| `apps/merchant/app/commissions/_components/commissions-table.tsx` | Created — statement columns + order link |
| `apps/merchant/app/distributors/[id]/_components/distributor-tabs.tsx` | Created — Overview \| Performance tab switcher |
| `apps/merchant/app/distributors/[id]/_components/overview-panel.tsx` | Created — QR, bindings, commission settings (from old detail) |
| `apps/merchant/app/distributors/[id]/_components/performance-panel.tsx` | Created — KPIs, presets, bar trend chart |
| `apps/merchant/app/distributors/[id]/_components/distributor-detail.tsx` | Refactored — tabs shell + back link |
| `apps/merchant/app/distributors/[id]/page.tsx` | Updated — prefetch `initialPerformance` |
| `packages/ui/src/components/shells/merchant-shell.tsx` | Updated — **Commissions** nav link (`/commissions`) |

## Ui-spec refs

| Surface | Showcase pattern |
|---------|------------------|
| `/commissions` | `ListPageFrame` (FW-LIST), `MetricCard`, `Table` + `Badge`, `EmptyState`, native `Select` + `Input` filters |
| Distributor Performance | `Tabs` styling (muted pill list from Tabs section), `Card` sections, `MetricCard` KPI grid |
| Status badges | Badge variants from Badges showcase |

## API wiring

All calls use `@meridian/shared` types and `apps/merchant/lib/commissions.ts`:

- `GET /merchant/commissions` — paginated list (default 30-day window)
- `GET /merchant/commissions/summary` — summary totals (respects same filters)
- `GET /merchant/distributors/:id/performance` — KPIs + `trend[]`

Frontend degrades gracefully when endpoints 404/500 (empty list, zeros, client retry on Performance tab).

## Empty / zero states

- **US-4.3:** `EmptyState` on `/commissions` when no ledger rows in window
- **US-4.2:** Zero KPIs and trend copy when no bindings/orders; not treated as errors

## RBAC

Owner and staff share read-only UI — no owner-only gates on Slice 3 surfaces.

## Open questions

None for frontend. Backend must ship endpoints + indexes before E2E passes.

## Next agent

**test-engineer** — map US-4.2 / US-4.3 P0: Playwright `/commissions` empty + filtered states; distributor Performance tab presets; API e2e for aggregates.
