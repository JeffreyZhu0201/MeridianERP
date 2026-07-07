# Handoff: Store Account — Implementation

**Agent:** nextjs-frontend / nestjs-backend  
**Date:** 2026-07-06  
**Branch:** feature/store-polish-and-account (from develop)

## Scope

- `CustomerDeliveryAddress` model on `PlatformAccount`
- API: `GET/POST/PATCH/DELETE /store/auth/addresses`, `PATCH /store/auth/me`, `POST /store/auth/change-password`
- Store routes: `/shop/account/addresses`, `/shop/account/settings`
- `StoreAccountSidebar` linked navigation; checkout default address prefill
- Middleware: all `/shop/account/*` require auth

## Files

- `apps/api/prisma/schema.prisma`, migration `20260706100000_customer_delivery_addresses`
- `apps/api/src/store/account/*`, `apps/api/test/store-account.e2e-spec.ts`
- `packages/shared/src/store-account.ts`
- `packages/ui/src/components/store/store-address-*.tsx`, `store-account-settings-form.tsx`
- `apps/store/app/shop/account/**`
- `docs/prd/store-account.md`, `docs/architecture/store-account.md`

## Open questions

None.

## Next agent

test-engineer — Playwright address smoke; full API regression.
