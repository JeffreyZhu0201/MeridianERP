# Phase 4 Slice 1 — Store Customer Bind Frontend Handoff

**Date:** 2025-06-25  
**Stories:** US-4.1, G-7  
**Architecture:** `docs/architecture/phase-4-distributor-enhancements.md`

## Handoff

- **Scope:** Store customer bind flow wired to store-scoped claim API; merchant distributor QR supports CUSTOMER bind type with store URL; shared types from `@meridian/shared`; `BindPageFrame` added to `@meridian/ui`.
- **Files:**
  - `apps/store/app/s/[slug]/bind/[token]/page.tsx` — store claim via `POST /store/:slug/bindings/claim`
  - `apps/store/lib/api.ts` — re-exports `BindVerifyResponse`, `StoreClaimBindingResponse`
  - `apps/merchant/app/distributors/[id]/_components/qr-display.tsx` — bindType picker (MERCHANT / CUSTOMER)
  - `apps/merchant/lib/api.ts` — re-exports `GenerateQrResponse`, `BindVerifyResponse`
  - `packages/ui/src/components/frameworks/bind-page-frame.tsx` — new FW-BIND frame
  - `packages/ui/src/components/frameworks/index.ts`, `packages/ui/src/index.ts` — exports
- **Open questions:** Backend `POST /store/:slug/bindings/claim`, verify `tenantSlug`, and CUSTOMER QR URL generation must land for end-to-end bind; frontend paths and types match architecture contracts.
- **Next agent:** `nestjs-backend` (store bindings controller + `claimCustomer`, verify enrichment, `generateQr` CUSTOMER URL) → `test-engineer` after API green

## Implementation Summary

### Store bind page (`/s/[slug]/bind/[token]`)

| Step | Behavior |
|------|----------|
| Verify | `GET /api/v1/bindings/verify/:token` → `BindVerifyResponse` from `@meridian/shared` |
| Slug guard | If `tenantSlug` present and ≠ URL `slug` → error |
| Wrong portal | `bindType === MERCHANT` → error message per architecture |
| Auth gate | `requiresAuth && !store JWT` → login/register with `?from=` return path |
| Claim | `POST /api/v1/store/{slug}/bindings/claim` `{ token }` + Bearer store JWT (via `storePath`) |
| Conflict | Surfaces `409` message from `ApiError` |
| Layout | `BindPageFrame` (FW-BIND) with `ModeToggle`, 44px CTAs |

### Merchant QR panel

- Audience selector: **Merchant partner** (`MERCHANT`) vs **Store customer** (`CUSTOMER`)
- `POST /merchant/distributors/:id/qr` body `{ bindType }` → `GenerateQrResponse`
- CUSTOMER QR displays store bind URL (`/s/{slug}/bind/{token}`) once backend returns it
- Badge + helper copy distinguish customer vs merchant campaigns

### Shared types

- `BindVerifyResponse`, `StoreClaimBindingRequest`, `StoreClaimBindingResponse`, `GenerateQrResponse` in `packages/shared/src/distributors.ts`
- Run `rtk pnpm --filter @meridian/shared build` after pulling if types missing from `dist/`

## Ui-spec refs

- **Auth / status card:** `AuthLayout` pattern (`apps/ui-spec` login-03) — mirrored in `BindPageFrame`
- **Card + Button + Skeleton:** ui-spec Card/Button/Skeleton sections
- **Select + Badge:** distributor QR audience picker
- **Table:** unchanged on distributor detail bindings list

## Missing APIs (backend)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/v1/store/:slug/bindings/claim` | **Not implemented** | `StoreAuthGuard`, `StoreClaimBindingResponse` |
| `GET /api/v1/bindings/verify/:token` | Partial | Needs `tenantSlug` on CUSTOMER; `{ valid: false }` shape (no throw) |
| `POST /merchant/distributors/:id/qr` | Partial | Needs CUSTOMER URL `{STORE_APP_URL}/s/{slug}/bind/{token}` and `bindType` + `expiresAt` in response |

## Test plan (frontend)

- [ ] Open CUSTOMER QR URL on store → verify → login → claim → success
- [ ] Slug mismatch shows error when `tenantSlug` ≠ URL slug
- [ ] MERCHANT token on store bind page shows portal error
- [ ] Already-bound conflict shows 409 message
- [ ] Merchant generates CUSTOMER QR → URL contains `/s/{slug}/bind/`
- [ ] Merchant generates MERCHANT QR → URL contains `/bind/` (merchant app)

## GitHub Handoff

- **Branch:** (current working tree on develop feature branch)
- **PR:** ready after backend Slice 1 merges
- **CI:** pending — run lint/typecheck/build on `@meridian/store`, `@meridian/merchant`, `@meridian/ui`
- **Docs:** `docs/architecture/phase-4-distributor-enhancements.md`, this handoff
