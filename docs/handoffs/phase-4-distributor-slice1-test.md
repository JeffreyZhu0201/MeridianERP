# Test Report: Phase 4 Slice 1 — US-4.1 (G-7)

**Date:** 2025-06-25  
**Engineer:** test-engineer  
**Scope:** Store customer bind (G-7) — API e2e + portal typecheck  
**PRD:** `docs/prd/phase-4-distributor-enhancements.md` US-4.1

---

## Executive Summary

| Layer | Command | Result |
|-------|---------|--------|
| API e2e | `rtk pnpm --filter @meridian/api test:e2e` | **PASS** — 12 suites, **47** tests |
| Store typecheck | `rtk pnpm --filter @meridian/store exec tsc --noEmit` | **PASS** |
| Merchant typecheck | `rtk pnpm --filter @meridian/merchant exec tsc --noEmit` | **PASS** |
| Admin typecheck | `rtk pnpm --filter @meridian/admin exec tsc --noEmit` | **PASS** |

**Bottom line:** US-4.1 backend contracts are fully green. G-7 (store customer bind) is **FIXED** at the API layer. UI bind flow is wired; Playwright smoke for logged-out verify → login → claim remains a coverage gap.

---

## US-4.1 Acceptance Criteria Matrix

| Criterion (Given/When/Then) | Test file | Status |
|-----------------------------|-----------|--------|
| Valid CUSTOMER token → verify returns `requiresAuth: true`, `tenantSlug`, store URL on QR | `bindings.e2e-spec.ts` — *generates CUSTOMER QR with store bind URL* | **PASS** |
| Logged-out user sees distributor name + sign-in prompt on bind page | — (UI only; no Playwright) | **PARTIAL** |
| Logged-in store JWT → confirm bind → CUSTOMER binding with customer ID + success | `bindings.e2e-spec.ts` — *store customer claim creates binding and sets cart distributorId* | **PASS** |
| Already bound to another distributor → 409 conflict, no silent overwrite | `bindings.e2e-spec.ts` — *rejects store claim when customer already bound to another distributor* | **PASS** |
| Expired or invalid token → error with guidance | — (no automated test) | **GAP** |
| Merchant claim rejected on CUSTOMER token (wrong portal) | `bindings.e2e-spec.ts` — *rejects merchant claim on CUSTOMER token* | **PASS** |
| Cart `distributorId` set after bind; persists on GET cart | `bindings.e2e-spec.ts` — *store customer claim* | **PASS** |
| Checkout after bind → order attributed + commission ACCRUED | `bindings.e2e-spec.ts` — *checkout after store bind accrues commission*; `store-checkout.e2e-spec.ts` — *accrues commission after store customer bind claim (US-4.1)* | **PASS** |
| Idempotent re-claim same distributor → 200 | `bindings.e2e-spec.ts` — *store customer claim* (second claim) | **PASS** |

---

## Automated Test Run Details

### API e2e — Slice 1 relevant suites

| Suite | Tests (Slice 1 relevant) | Status |
|-------|--------------------------|--------|
| `bindings.e2e-spec.ts` | 7 (incl. 5 CUSTOMER bind) | PASS |
| `store-checkout.e2e-spec.ts` | 1 (US-4.1 commission path) | PASS |
| All 12 suites | 47 total | PASS |

### Portal typecheck

All three portal apps compile cleanly (sidebar TS regression from prior loop resolved).

---

## G-7 Resolution

| Before | After |
|--------|-------|
| `POST /bindings/claim` merchant-only; store bind page unusable | `POST /store/:slug/bindings/claim` with store JWT |
| Verify returned `{valid, distributorId, bindType}` only | Enriched `BindVerifyResponse`: `requiresAuth`, `tenantSlug`, `distributorName` |
| CUSTOMER QR pointed at merchant app | `{STORE_APP_URL}/s/{slug}/bind/{token}` |
| No cart attribution after bind | Claim sets `cart.distributorId`; lazy hydrate on resolve |

---

## Coverage Gaps

| Gap | Recommendation |
|-----|----------------|
| Invalid/expired token verify | Add `bindings.e2e-spec.ts` case for `{ valid: false }` |
| Logged-out bind page UI | Playwright: `/s/{slug}/bind/{token}` → login redirect → claim |
| Slug mismatch / MERCHANT token on store page | Playwright or component test on store bind page |

---

## Handoff

- **Scope:** Phase 4 Slice 1 (US-4.1 / G-7) verification
- **Files:** `apps/api/test/bindings.e2e-spec.ts`, `apps/api/test/store-checkout.e2e-spec.ts`, this report
- **Results:** 47 API e2e passed, 0 failed; store/merchant/admin tsc passed
- **Next agent:** user (merge) or devops-engineer (CI); optional Playwright bind smoke before Phase 4 Slice 2
