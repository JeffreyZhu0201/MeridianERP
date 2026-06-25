# Handoff: Phase 4 Slice 2 (US-4.4) — Test Report

**Date:** 2025-06-25  
**Stories:** US-4.4 (QR link management)  
**Verifier:** test-engineer

## Test Report: US-4.4 QR Management

| Acceptance Criterion | Test file | Status |
|---------------------|-----------|--------|
| Generate MERCHANT QR → merchant bind URL | `apps/api/test/bindings.e2e-spec.ts` — `generates QR, verifies token, and claims binding` | PASS |
| Generate CUSTOMER QR → store bind URL under tenant slug | `bindings.e2e-spec.ts` — `generates CUSTOMER QR with store bind URL` | PASS |
| Regenerate issues new token, invalidates previous same bindType | `bindings.e2e-spec.ts` — `US-4.4 QR management › regenerate revokes prior same bindType token only` | PASS |
| CUSTOMER QR survives MERCHANT regenerate (per bindType) | same test | PASS |
| Download PNG suitable for print/social | `bindings.e2e-spec.ts` — `US-4.4 QR management › downloads QR as PNG` | PASS |
| Configurable expiry (`expiresInDays`) | `bindings.e2e-spec.ts` — `lists QR history with active and revoked status` (14-day row) | PASS |
| QR history: created, bind type, expiry, active/revoked | `bindings.e2e-spec.ts` — `lists QR history with active and revoked status` | PASS |
| Revoked token verify returns `valid: false` | `bindings.e2e-spec.ts` — `rejects verify for revoked token after regenerate` | PASS |
| Expired token verify fails | `bindings.e2e-spec.ts` — `returns valid false for unknown or expired bind tokens` | PASS |
| Merchant portal TypeScript | `pnpm --filter @meridian/merchant exec tsc --noEmit` | PASS |

## Commands & Results

| Suite | Command | Passed | Failed |
|-------|---------|--------|--------|
| API e2e | `rtk pnpm --filter @meridian/api test:e2e` | **52** | **0** |
| Merchant typecheck | `rtk pnpm --filter @meridian/merchant exec tsc --noEmit` | **1** (clean) | **0** |

## Changes Made During Verification

### New e2e tests (`apps/api/test/bindings.e2e-spec.ts`)

Added `describe('US-4.4 QR management')` with four cases:

1. **regenerate revokes prior same bindType token only** — MERCHANT regenerate revokes first MERCHANT token; CUSTOMER token remains valid.
2. **lists QR history with active and revoked status** — `GET /merchant/distributors/:id/qr` returns `REVOKED` + `ACTIVE` rows.
3. **downloads QR as PNG** — `GET …/qr/:qrId/download` returns `image/png` buffer > 100 bytes.
4. **rejects verify for revoked token after regenerate** — `GET /bindings/verify/:token` → `valid: false`.

### Bug fix uncovered by tests (`apps/api/src/merchant/distributors/distributors.service.ts`)

Regenerate within the same second produced identical JWTs (same `iat`), violating `@unique` on `DistributorQrCode.token` in production and breaking mock `qrByToken` lookup. Fixed by adding `jti: randomUUID()` to the bind-token JWT payload.

## Open Items

- **Playwright smoke** for merchant QR panel (expiry selector, history table, download button) — not in scope for this API verification pass; recommend follow-up e2e in `e2e/`.
- **Staff 403 on POST generate** — architecture calls for owner-only regenerate; no API e2e yet (RBAC P0 for slice 2 arch checklist).

## Handoff

- **Scope:** US-4.4 P0 API verification + merchant typecheck
- **Files:** `apps/api/test/bindings.e2e-spec.ts`, `apps/api/src/merchant/distributors/distributors.service.ts`, `docs/handoffs/phase-4-distributor-slice2-test.md`
- **Results:** API e2e **52 passed / 0 failed**; merchant tsc **pass**
- **Next agent:** `devops-engineer` (if shipping) or user for Playwright merchant UI smoke
