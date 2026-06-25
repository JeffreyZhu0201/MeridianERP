# Handoff: Phase 4 Slice 2 (US-4.4 / US-4.8) — Backend

**Agent:** nestjs-backend  
**Date:** 2025-06-25  
**Depends on:** Slice 1 (US-4.1 / G-7)

## Scope

Implemented QR link management backend:

- **`DistributorQrCode.revokedAt`** migration + composite index on `(distributorId, bindType)`
- **`POST /merchant/distributors/:id/qr`** — owner-only; `expiresInDays` 1–90 (default 7); transactional revoke of active same-`bindType` tokens; returns `id`
- **`GET /merchant/distributors/:id/qr`** — paginated history with computed `status` and rebuilt URLs
- **`GET /merchant/distributors/:id/qr/:qrId/download`** — 512×512 PNG via `qrcode` package
- **`BindingsService`** — verify/claim reject revoked tokens before expiry check
- **E2E** — revoke isolation, staff 403 on POST, staff history/download, validation, pagination

## Files

| Path | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | `revokedAt`, `@@index([distributorId, bindType])` |
| `apps/api/prisma/migrations/20250625120000_distributor_qr_revoked_at/` | Migration SQL |
| `apps/api/package.json` | `qrcode`, `@types/qrcode` |
| `apps/api/src/merchant/distributors/qr-url.helper.ts` | `buildBindQrUrl()` |
| `apps/api/src/merchant/distributors/dto/distributor.dto.ts` | `expiresInDays`, `QrHistoryListQueryDto` |
| `apps/api/src/merchant/distributors/distributors.service.ts` | `generateQr`, `listQrHistory`, `downloadQrPng`, `assertOwner` |
| `apps/api/src/merchant/distributors/distributors.controller.ts` | GET history + download routes |
| `apps/api/src/bindings/bindings.service.ts` | Revoked token checks |
| `apps/api/test/helpers/mock-prisma.ts` | `revokedAt`, `updateMany`, `findMany`, `count`, `findFirst` |
| `apps/api/test/bindings.e2e-spec.ts` | US-4.4 test cases |

## Migration

```bash
rtk pnpm --filter @meridian/api prisma:migrate deploy
# or for dev:
rtk pnpm --filter @meridian/api prisma:migrate -- --name distributor_qr_revoked_at
```

## API summary

| Method | Path | RBAC |
|--------|------|------|
| `POST` | `/api/v1/merchant/distributors/:id/qr` | Owner |
| `GET` | `/api/v1/merchant/distributors/:id/qr` | Owner + Staff |
| `GET` | `/api/v1/merchant/distributors/:id/qr/:qrId/download` | Owner + Staff |

## Tests

```bash
rtk pnpm --filter @meridian/api test:e2e -- bindings.e2e-spec.ts
```

All 56 API e2e tests green.

## Open questions

None.

## Next agent

**nextjs-frontend** — expiry selector, history table, PNG download button, staff UX (hide generate).  
**test-engineer** — map US-4.4 P0 criteria to full test report.
