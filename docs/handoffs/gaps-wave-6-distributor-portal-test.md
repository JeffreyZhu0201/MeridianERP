# Gaps Wave 6 — Distributor Portal Test Handoff

## Scope

US-4.10 read-only distributor self-service portal; merchant portal access management.

## Files

- `apps/distributor/*` (port 3005)
- `apps/api/src/distributor/*`
- `apps/api/src/auth/strategies/distributor-jwt.strategy.ts`
- `apps/api/src/auth/guards/distributor-auth.guard.ts`
- `apps/merchant/app/distributors/[id]/_components/portal-access-card.tsx`
- `apps/api/test/distributor-portal.e2e-spec.ts`
- Root `package.json` `dev:distributor`
- `.env.example` (`JWT_DISTRIBUTOR_SECRET`, `DISTRIBUTOR_APP_URL`)

## P0 acceptance

| Criterion | Test | Status |
|-----------|------|--------|
| Owner enables portal + sets password | `distributor-portal.e2e-spec.ts` | PASS |
| Distributor login + dashboard | `distributor-portal.e2e-spec.ts` | PASS |
| Commission read-only ledger | `distributor-portal.e2e-spec.ts` | PASS |

## Open questions

- Distributor not yet in Docker Compose dev profile (local `pnpm dev:distributor` only).

## Next agent

GitHub shipping — feature branches per wave → `develop`.
