# Handoff: Flagship Catalog Store — Implementation

**Agent:** nextjs-frontend / nestjs-backend  
**Date:** 2026-07-06  
**Branch:** feature/store-polish-and-account (from develop)

## Scope

- Unified flagship catalog at `/shop` with branch fulfillment selector
- Store P2: account orders, checkout shell, catalog filter/sort via URL
- Landing portal embed previews (`/embed-preview`) with layout fixes
- Distributor portal `ErpShell` sidebar layout
- Store embed preview forced dark mode

## Files

- `apps/api/src/store/catalog/*`, `apps/api/src/platform/flagship-catalog/*`
- `apps/store/app/shop/*`, `apps/store/middleware.ts`
- `apps/landing/components/portal-ui-preview.tsx`, `apps/landing/lib/portal-embed.ts`
- `packages/ui/src/components/shells/distributor-shell.tsx`
- `docs/prd/flagship-catalog-store.md`, `docs/architecture/flagship-catalog-store.md`, `docs/design/store.md`

## Open questions

None.

## Next agent

test-engineer — store-account + regression e2e; Playwright smoke.
