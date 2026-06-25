# Gaps Wave 1 — Quick Wins Test Handoff

## Scope

G-2 admin merchant list filters; `GET /merchant/dashboard`; StoreShell `ModeToggle`.

## Files

- `apps/api/src/platform/merchants/dto/list-merchants-query.dto.ts`
- `apps/api/src/platform/merchants/platform-merchants.service.ts`
- `apps/admin/app/merchants/_components/merchants-pagination.tsx`
- `apps/api/src/merchant/dashboard/*`
- `packages/shared/src/merchant-dashboard.ts`
- `packages/ui/src/components/shells/store-shell.tsx`
- `apps/api/test/gaps-wave1.e2e-spec.ts`

## P0 acceptance

| Criterion | Test | Status |
|-----------|------|--------|
| Merchant list filters by status/search | `gaps-wave1.e2e-spec.ts` | PASS |
| Dashboard aggregates counts + recent leads | `gaps-wave1.e2e-spec.ts` | PASS |
| Store shell exposes theme toggle | Playwright `gaps-store.spec.ts` | PASS |

## Open questions

- ui-spec Store Shell showcase remains optional P1.

## Next agent

Wave 2 store commerce (`gaps-wave-2-store`).
