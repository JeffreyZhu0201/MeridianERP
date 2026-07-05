# Handoff: Remove Branch Distributors — Implementation

**Agent:** nestjs-backend / nextjs-frontend / test-engineer
**Date:** 2026-07-04
**Branch:** develop (working tree only; no commit)

## Scope

Removed the branch-store downstream distributor and QR binding feature path while retaining HQ sales promoter commission through allocation orders.

- Removed branch binding schema (`Binding`, `DistributorQrCode`, `BindType`) and order/cart distributor attribution.
- Removed retail order commission queue/accrual paths and email binding notifications.
- Removed merchant distributor pages, bind pages, bind routes, dashboard binding/distributor metrics, and settings binding notification UI.
- Kept platform distributors as HQ sales promoters, recruiter assignment, allocation commission accrual, settlements, withdrawals, and distributor portal commission views.
- Updated shared contracts/i18n and e2e fixtures to match the allocation-only commission model.

## Files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260704160000_remove_branch_distributor_binding/migration.sql`
- `apps/api/prisma/migrations/20260704161000_remove_crm_lead_distributor/migration.sql`
- `apps/api/src/commission/commission.service.ts`
- `apps/api/src/queue/*`
- `apps/api/src/merchant/**`
- `apps/api/src/platform/**`
- `apps/merchant/**`
- `apps/admin/**`
- `apps/store/lib/api.ts`
- `packages/shared/src/**`
- `apps/api/test/**`

## Verification

- `rtk pnpm typecheck` passed.
- `rtk pnpm --filter @meridian/api test:e2e` passed: 39 suites, 161 tests.
- IDE lint check for edited app/shared paths reported no errors.

## Open Questions

- Historical architecture/PRD docs still describe the removed branch distributor QR/binding feature. Product docs should be updated in a docs-only follow-up if this removal is permanent.
- `apps/api/test/helpers/mock-prisma.ts` still contains unused legacy mock helpers for binding/QR compatibility. They no longer block tests, but can be trimmed in a dedicated test-helper cleanup.

## Next Agent

devops-engineer or reviewer can prepare a branch/PR from develop and validate migrations in a fresh database.
