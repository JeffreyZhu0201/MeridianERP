# Handoff: Platform UI Blocks & Gap Closure — Architecture

**Agent:** architect  
**Date:** 2025-06-25  
**Branch:** TBD — branch from `develop` (e.g. `feature/platform-ui-blocks-and-gaps`)

## Scope

Architecture complete for Workstream A (auth layout + shell SidebarProvider refactor) and Workstream B (checkout path, guest cart session, admin reject DTO, merchant orders, CRM activities). **No backend API changes.** Shared client contracts added to `packages/shared`.

Key decisions:

- Copy `sidebar.tsx` from ui-spec into `packages/ui` (not direct ui-spec imports, not incremental legacy wrap)
- Guest cart: `localStorage` key `meridian:cart-session:{slug}` + auto-inject `X-Cart-Session` in store `apiFetch`; RSC pages hydrate cart client-side for guests
- Checkout: use `storePath(slug, 'checkout')` not `/store/checkout`
- Admin reject: POST `{ reason }` only (UI fix)
- Merchant orders: new `/orders` list + `/orders/[id]` detail using existing API
- CRM: activity timeline on new contact/lead detail routes; optional `/crm/activities` global list

## Files

- `docs/architecture/platform-ui-blocks-and-gaps.md`
- `packages/shared/src/platform.ts` — `RejectMerchantRequest`
- `packages/shared/src/crm.ts` — `CrmActivity`, `CreateActivityRequest`
- `packages/shared/src/ecommerce.ts` — merchant order types, checkout types, cart session constants
- `packages/shared/src/index.ts` — re-exports

## Open questions

1. Store auth brand mark final copy — ui-designer (recommendation: merchant business name + "Powered by MeridianERP")
2. Playwright spec location — test-engineer (`platform-gaps.spec.ts` vs extend `phase-2-store.spec.ts`)
3. Admin reject dialog label copy — ui-designer ("Rejection reason" vs "Reason")
4. Portal `globals.css` sidebar token sync — verify during ui-designer / nextjs-frontend shell work

## Next agents

1. **ui-designer** — `docs/design/platform-ui-blocks-and-gaps.md`: AuthLayout wireframes, shell nav layout, orders table columns, activity timeline, store brand area
2. **nextjs-frontend** + **nestjs-backend** (parallel, backend likely no-op):
   - **Phase 1 (B P0):** store checkout + cart session, admin reject body
   - **Phase 2 (A):** AuthLayout, sidebar copy, AdminShell/MerchantShell refactor
   - **Phase 3 (B P1):** merchant orders pages, CRM detail + activity timeline
3. **test-engineer** — map tests to US-B1–B5, US-A1–A6 per architecture testing table

## GitHub Handoff

- **Branch:** `feature/platform-ui-blocks-and-gaps` (base: `develop`)
- **PR:** ready to open after implementation phases
- **CI:** lint → test → build
- **Docs:** `docs/prd/platform-ui-blocks-and-gaps.md`, `docs/architecture/platform-ui-blocks-and-gaps.md`, `docs/design/platform-ui-blocks-and-gaps.md` (pending ui-designer)
