# Handoff: Phase 4 Slice 1 (US-4.1 / G-7) — Backend

**Agent:** nestjs-backend  
**Date:** 2025-06-25  
**Branch:** `feature/phase-4-distributor-enhancements` (from `develop`)

## Scope

Store customer bind path (G-7) backend complete per `docs/architecture/phase-4-distributor-enhancements.md` Slice 1.

### Completed

- **BindingsService** refactored: `claimMerchant()` (`bindableId = tenantId`, MERCHANT only, CRM lead), `claimCustomer()` (`bindableId = customerId`, cart attribution, no CRM)
- **verify()** enriched: ISO `expiresAt`, `tenantSlug` for CUSTOMER, `requiresAuth`, returns `BindVerifyResponse` without throwing
- **POST /bindings/claim** — `MerchantAuthGuard`, MERCHANT tokens only; rejects CUSTOMER with 400
- **POST /store/:slug/bindings/claim** — `StoreAuthGuard`, CUSTOMER tokens; 201 new / 200 idempotent re-claim; 409 on different distributor
- **DistributorsService.generateQr** — CUSTOMER URLs `{STORE_APP_URL}/s/{tenantSlug}/bind/{token}`; response includes `bindType`, `expiresAt`
- **StoreCartService.resolveCart** — lazy `distributorId` hydrate from CUSTOMER binding
- **StoreCheckoutService.checkout** — binding fallback before order create
- **E2E** — `bindings.e2e-spec.ts` + `store-checkout.e2e-spec.ts` CUSTOMER claim path, conflict, cart, commission

## Files

| Path | Change |
|------|--------|
| `apps/api/src/bindings/bindings.service.ts` | Refactor verify, claimMerchant, claimCustomer |
| `apps/api/src/bindings/bindings.controller.ts` | Merchant claim only; verify no try/catch |
| `apps/api/src/bindings/bindings.module.ts` | Export BindingsService |
| `apps/api/src/store/bindings/store-bindings.controller.ts` | New store claim endpoint |
| `apps/api/src/store/bindings/store-bindings.service.ts` | Slug + JWT tenant validation |
| `apps/api/src/store/store.module.ts` | Wire bindings controller/service |
| `apps/api/src/merchant/distributors/distributors.service.ts` | CUSTOMER QR URL fix |
| `apps/api/src/store/cart/store-cart.service.ts` | Lazy distributor hydrate |
| `apps/api/src/store/checkout/store-checkout.service.ts` | Checkout binding fallback |
| `apps/api/test/bindings.e2e-spec.ts` | CUSTOMER path tests |
| `apps/api/test/store-checkout.e2e-spec.ts` | US-4.1 commission after bind |
| `apps/api/test/helpers/mock-prisma.ts` | `tenant.findUniqueOrThrow` |

## Migration

None — Slice 1 uses existing schema (`Binding`, `Cart.distributorId`).

## Test results

```
pnpm --filter @meridian/api test:e2e -- bindings.e2e-spec.ts store-checkout.e2e-spec.ts
Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
```

## Open questions

None for Slice 1 backend.

## Next agent

- **nextjs-frontend** — store bind page → `POST /store/{slug}/bindings/claim`; slug vs `tenantSlug` validation
- **test-engineer** — map US-4.1 acceptance criteria; Playwright store bind → checkout smoke
