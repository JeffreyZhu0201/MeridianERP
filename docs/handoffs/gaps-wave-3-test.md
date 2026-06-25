# Gaps Wave 3 — Platform Settings Test Handoff

## Scope

`TenantSettings` / `PlatformSettings` Prisma models; merchant settings + team APIs; Admin/Merchant settings UI.

## Files

- `apps/api/prisma/schema.prisma` (migration `20260625044035_*`)
- `apps/api/src/merchant/settings/*`
- `apps/api/src/platform/settings/*`
- `apps/api/src/auth/guards/merchant-owner.guard.ts`
- `packages/shared/src/settings.ts`
- `apps/merchant/app/settings/_components/settings-panels.tsx`
- `apps/admin/app/settings/_components/platform-settings-form.tsx`
- `apps/api/test/merchant-settings.e2e-spec.ts`
- `apps/api/test/platform-settings.e2e-spec.ts`
- `apps/api/prisma/seed.ts` (PlatformSettings + TenantSettings)

## P0 acceptance

| Criterion | Test | Status |
|-----------|------|--------|
| Owner PATCH settings; staff read-only PATCH | `merchant-settings.e2e-spec.ts` | PASS |
| Team CRUD owner-only | `merchant-settings.e2e-spec.ts` | PASS |
| Admin platform settings GET/PATCH | `platform-settings.e2e-spec.ts` | PASS |
| Seed creates settings defaults | `prisma db seed` | PASS |

## Open questions

- Staff invite email job deferred to Wave 4 queue integration.

## Next agent

Wave 4 email queue.
