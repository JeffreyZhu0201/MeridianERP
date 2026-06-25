# Handoff: Phase 4 Distributor Enhancements — Architecture

**Agent:** architect  
**Date:** 2025-06-25  
**Branch:** `feature/phase-4-distributor-enhancements` (from `develop`)

## Scope

Phase 4 architecture complete. Resolves test-handoff open questions (G-7 store bind, CUSTOMER QR URLs, cart attribution, commission read APIs, QR regenerate). **Slice 1 (US-4.1)** is the first implementation gate.

**Locked decisions:**

- **Store claim:** `POST /api/v1/store/:slug/bindings/claim` with `StoreAuthGuard` — do **not** dual-guard existing `POST /bindings/claim`
- **CUSTOMER QR URL:** `{STORE_APP_URL}/s/{tenantSlug}/bind/{token}`
- **Cart attribution:** set `cart.distributorId` on claim; lazy hydrate from `Binding` in `resolveCart` + checkout fallback
- **QR regenerate:** revoke prior **same bindType** tokens via `DistributorQrCode.revokedAt` (Slice 2 migration)
- **Commission reads:** `GET /merchant/commissions`, `/summary`, `/distributors/:id/performance` — tenant-scoped ledger queries
- **Platform dashboard:** `GET /platform/dashboard` with live distributor/binding/commission metrics
- **Merchant payout visibility:** platform `SETTLED` status only — no local paid-out flag

## Files

| Path | Action |
|------|--------|
| `docs/architecture/phase-4-distributor-enhancements.md` | Created |
| `docs/handoffs/phase-4-distributor-architecture.md` | Created |
| `packages/shared/src/distributors.ts` | Created — API contracts (Slice 1 + forward types) |
| `packages/shared/src/index.ts` | Re-exports `distributors` |

**Not modified (implementation phase):** `apps/api` services, Prisma migrations (except Slice 2 `revokedAt`), portal UI.

## Slice 1 implementation checklist (US-4.1)

### Backend (`nestjs-backend`)

- [ ] Refactor `BindingsService`: `claimMerchant()`, `claimCustomer()`; fix `bindableId` bug
- [ ] Add `store/bindings/store-bindings.controller.ts` — `POST /store/:slug/bindings/claim`
- [ ] `DistributorsService.generateQr` — CUSTOMER URL with tenant slug; load `tenant.slug`
- [ ] `StoreCartService.resolveCart` — lazy `distributorId` from CUSTOMER binding
- [ ] `StoreCheckoutService.checkout` — binding fallback before order create
- [ ] Extend `bindings.e2e-spec.ts` — CUSTOMER path, 409 conflict, cart + commission

### Frontend (`nextjs-frontend`)

- [ ] `apps/store/.../bind/[token]/page.tsx` — call `/store/{slug}/bindings/claim`; slug vs `tenantSlug` check
- [ ] Merchant QR UI — pass `bindType: CUSTOMER` when generating customer links (minimal for Slice 1 URL fix)

### Shared

- [ ] Import types from `@meridian/shared` in store `api.ts` (replace local `BindVerifyResponse`)

## Key endpoints (by slice)

| Slice | Method | Path |
|-------|--------|------|
| **1** | `GET` | `/bindings/verify/:token` |
| **1** | `POST` | `/bindings/claim` (merchant, MERCHANT only) |
| **1** | `POST` | `/store/:slug/bindings/claim` (store, CUSTOMER) |
| **2** | `POST` | `/merchant/distributors/:id/qr` |
| **2** | `GET` | `/merchant/distributors/:id/qr` |
| **2** | `GET` | `/merchant/distributors/:id/qr/:qrId/download` |
| **3** | `GET` | `/merchant/commissions` |
| **3** | `GET` | `/merchant/commissions/summary` |
| **3** | `GET` | `/merchant/distributors/:id/performance` |
| **4** | `GET` | `/platform/dashboard` |

## Implementation order

1. **US-4.1 / G-7** — store bind + CUSTOMER QR URL + cart attribution (P0 blocker)
2. **US-4.4 / US-4.8** — QR regenerate, history, download, expiry
3. **US-4.2 / US-4.3** — performance dashboard + commission statements
4. **US-4.5** — platform dashboard + merchant detail enrichment
5. **P1** — notifications (US-4.6), order attribution UI (US-4.7)

Slices 2 and 3 can run in parallel after Slice 1 e2e is green.

## Open questions

| Item | Status |
|------|--------|
| Store claim vs dual-guard | **Resolved** — new store endpoint |
| QR invalidation scope | **Resolved** — per bindType |
| QR expiry bounds | **Resolved** — 1–90d, default 7d |
| Merchant local paid-out | **Resolved** — SETTLED only |
| In-app notifications P1 | **Resolved** — widget only; inbox deferred |
| Performance dashboard placement | **UI designer** — per-distributor P0 |
| Email recipient list | **Deferred** — owner only P1 |
| US-4.9 hierarchy pilot | **Deferred P2** |

## Next agents

1. **nestjs-backend** + **nextjs-frontend** — Slice 1 in parallel (contracts in `packages/shared` ready)
2. **ui-designer** — distributor performance, QR management, commission statements screens (after Slice 1 or in parallel for Slice 2–3)
3. **test-engineer** — map US-4.1 acceptance criteria to e2e after Slice 1 merge
