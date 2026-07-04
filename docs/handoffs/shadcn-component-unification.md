# Handoff: shadcn Component Unification

**Agent:** ui-designer audit + nextjs-frontend implementation  
**Date:** 2026-07-04  
**Branch:** feature/admin-rbac-roles

## Scope

Unify cross-portal UI on shadcn primitives from `@meridian/ui` — no new features.

## New shared components (`packages/ui`)

| Component | Path |
|-----------|------|
| `ErpListPage` | `components/frameworks/erp-list-page.tsx` |
| `ListPagination` | `components/list-pagination.tsx` |
| `OnboardingStatusBadge` | `components/status/onboarding-status-badge.tsx` |
| `OrderStatusBadge` | `components/status/order-status-badge.tsx` |

## Exports added

- `DropdownMenu`, `Tooltip` from `index.ts`
- `ErpListPage`, status badges from `server.ts`

## Removed duplicates

- `apps/admin/components/list-pagination.tsx`
- `apps/merchant/components/list-pagination.tsx`
- `apps/admin/app/merchants/_components/merchants-pagination.tsx`
- `apps/admin/components/status-badge.tsx` (→ `@meridian/ui`)

## Portal fixes

- Merchants page → `ErpListPage` + shared `ListPagination`
- Store open-shop → shadcn `Button asChild`
- Merchant inventory PO/transfers → `Button asChild`
- Admin CRM leads + merchant team settings → `toast.error` instead of `alert()`

## Docs

- `docs/design/design-system.md` — shared component table

## Follow-up (optional)

- Migrate remaining admin list pages to `ErpListPage`
- Adopt `OrderStatusBadge` in admin/merchant order tables
- Add `UrlFilterBar` shared filter component
