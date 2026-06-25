# Handoff: Loop Test Engineer

**Date:** 2025-06-25  
**Phase:** Verification (workflow Phase 5)  
**Feature scope:** Platform Phases 1–2 P0 regression loop

## Handoff

- **Scope:** Comprehensive test report for P0 criteria across Phase 1 foundation and Phase 2 e-commerce; automated command verification; distributor flow mapping; known-issue grep.
- **Files:**
  - `docs/handoffs/loop-test-report.md` (full report)
  - `docs/handoffs/loop-test-engineer.md` (this file)
- **Results:**
  - API e2e: **41 passed**, 0 failed
  - `@meridian/ui` build: **FAILED** (sidebar TS2769)
  - `@meridian/admin` tsc: **FAILED** (sidebar)
  - `@meridian/merchant` tsc: **FAILED** (sidebar)
  - P0 UI criteria: **4 FAIL** (US-2.3, US-2.4, US-11; plus CI typecheck blocker)
- **Open questions:**
  - Should CUSTOMER QR URLs use tenant slug from env or be generated per-store at QR time?
  - Is store customer bind a new `StoreBindingsController` or extend `BindingsController` with `StoreAuthGuard`?
- **Next agent:** `nextjs-frontend` — fix B-P0-1 (sidebar), B-P0-2 (checkout SSR session), B-P2-1 (debug logs); then `nestjs-backend` for B-P0-3/B-P0-4/B-P0-5 customer bind + cart attribution.

## Commands Executed

```bash
rtk pnpm --filter @meridian/api test:e2e          # PASS 41/41
rtk pnpm --filter @meridian/ui build              # FAIL sidebar.tsx:496
rtk pnpm --filter @meridian/admin exec tsc --noEmit   # FAIL
rtk pnpm --filter @meridian/merchant exec tsc --noEmit # FAIL
```

## Key Deliverables for Parent Agent

### Bug list (P0 first)

1. **B-P0-1** — `packages/ui` sidebar `data-size` TypeScript error blocks all portal typechecks
2. **B-P0-2** — Store checkout page missing guest cart session on SSR
3. **B-P0-3** — Store bind uses merchant-only claim endpoint
4. **B-P0-4** — No API to set `cart.distributorId` after customer bind
5. **B-P0-5** — QR URLs always point to merchant app, not store

### Distributor gaps

- Merchant CRUD + QR + merchant bind: **working end-to-end (API + UI)**
- Customer bind → cart attribution → checkout commission: **API commission works when `cart.distributorId` preset; no UI/API path for customers**
- QR generation: no bindType selector; CUSTOMER flow not productized

### Recommended next features

See prioritized list in `loop-test-report.md` § Recommended Next Product Features.
