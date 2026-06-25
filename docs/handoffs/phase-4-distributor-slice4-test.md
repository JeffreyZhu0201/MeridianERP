# Phase 4 Slice 4 — Test Handoff (US-4.5)

**Feature:** Platform admin distributor metrics (G-3, G-4)  
**Date:** 2025-06-25  
**Agent:** test-engineer

## Test Report: US-4.5 Platform Admin Metrics

| Acceptance Criterion | Test file / review | Status |
|---------------------|-------------------|--------|
| US-4.5: Dashboard shows live counts (distributors, bindings 30d, commission accrued 30d) | `apps/api/test/platform-dashboard.e2e-spec.ts` — `returns live cross-tenant dashboard metrics` | **PASS** |
| US-4.5: Merchant detail shows distributor list with binding count and recent activity | `platform-dashboard.e2e-spec.ts` — `GET /platform/merchants/:id returns crmSummary and distributor metrics` | **PASS** |
| US-4.5 / G-3: Dashboard API failure → error state, not hardcoded zeros | Code review: `apps/admin/app/page.tsx` (`loadDashboard` catch → `error` banner; metrics gated on `stats`) | **PASS** |
| G-4: Merchant detail enriched `crmSummary` + `distributors[]` (not empty placeholders) | E2E merchant detail cases + `merchant-detail.tsx` table columns | **PASS** |
| G-4: Zero distributors → empty state, CRM still populated | `platform-dashboard.e2e-spec.ts` — `returns empty distributors with crmSummary` | **PASS** |
| Auth: Unauthenticated dashboard → 401 | `platform-dashboard.e2e-spec.ts` — `returns 401 without platform token` | **PASS** |
| Admin types align with `@meridian/shared` | `rtk pnpm --filter @meridian/admin exec tsc --noEmit` | **PASS** |

## Execution Results

| Suite | Result |
|-------|--------|
| `rtk pnpm --filter @meridian/api test:e2e` | **70 passed**, 0 failed (14 suites) |
| `platform-dashboard.e2e-spec.ts` (isolated) | **4 passed**, 0 failed |
| `rtk pnpm --filter @meridian/admin exec tsc --noEmit` | **PASS** (exit 0) |

## G-3 Compliance Review (`apps/admin/app/page.tsx`)

- `loadDashboard()` wraps `apiFetch` in try/catch; on failure returns `{ stats: null, error: message }`.
- UI renders a destructive alert when `error` is set; metric cards and recent-merchants table are **not** rendered.
- No hardcoded zero fallbacks or synthetic defaults found in admin dashboard code.
- Legitimate zero values from a successful API response (e.g. `bindingsLast30Days: 0`) are displayed correctly — distinct from error-path synthetic zeros.

## G-4 Compliance Review (`merchant-detail.tsx`)

- CRM summary renders `contacts`, `companies`, `leads` from API payload.
- Distributors table columns: Name, Status, Total bindings, Bindings (30d), Orders (30d).
- Empty distributors show dashed-border zero-state copy (not hidden section).
- Merchant detail page (`merchants/[id]/page.tsx`) calls `notFound()` on fetch failure (404-style UX); acceptable for G-4 — G-3 applies specifically to dashboard.

## Test Plan Checklist (P0)

- [x] `GET /api/v1/platform/dashboard` returns cross-tenant aggregates (active distributors, bindings 30d, commission ACCRUED 30d)
- [x] Dashboard excludes inactive distributors from `activeDistributors`
- [x] Dashboard excludes bindings/commission outside 30d window; SETTLED commission excluded
- [x] `recentMerchants` capped at 5, ordered by `createdAt` desc
- [x] `GET /api/v1/platform/merchants/:id` returns `crmSummary` counts
- [x] Merchant detail `distributors[]` includes `bindingCount`, `bindingsLast30Days`, `attributedOrdersLast30Days`
- [x] Tenant with no distributors returns `distributors: []` with populated `crmSummary`
- [x] Unauthenticated dashboard request returns 401
- [x] Admin dashboard shows error banner on API failure (no synthetic zeros)
- [x] Admin `tsc --noEmit` passes with shared types

## Bugs Found

**None.** No code changes required during verification.

## Gaps / Follow-ups (non-blocking)

| Item | Priority | Notes |
|------|----------|-------|
| Playwright admin smoke (API 500 → error banner) | P1 | Architecture doc lists manual/Playwright smoke; not automated in this slice |
| Merchant detail API 500 UX | P2 | Currently maps all errors to `notFound()`; consider dedicated error panel if ops need distinction from missing merchant |
| Redis cache (5 min TTL) | P2 | Architecture optional; skipped in MVP per ADR |

## Handoff

- **Scope:** Verification of Phase 4 Slice 4 (US-4.5) — platform dashboard API, enriched merchant detail, admin UI G-3/G-4
- **Files reviewed:** `apps/api/test/platform-dashboard.e2e-spec.ts`, `apps/api/src/platform/dashboard/`, `apps/api/src/platform/merchants/platform-merchants.service.ts`, `apps/admin/app/page.tsx`, `apps/admin/app/merchants/[id]/_components/merchant-detail.tsx`, `apps/admin/lib/api.ts`
- **Results:** 70 API e2e passed (4 slice-specific), admin tsc passed, all P0 criteria **PASS**
- **Fixes applied:** None
- **Next agent:** devops-engineer (if deploying) or user (ready for PR to `develop`)
