# Handoff: Phase 4 Slice 2 (US-4.4 / US-4.8) — Architecture

**Agent:** architect  
**Date:** 2025-06-25  
**Branch:** `feature/phase-4-distributor-enhancements` (from `develop`)  
**Depends on:** Slice 1 (US-4.1 / G-7) shipped

## Scope

Architecture for **QR link management** — regenerate with per-`bindType` revocation, configurable expiry, paginated history, and server-rendered PNG download.

**Locked decisions:**

- **`revokedAt`** on `DistributorQrCode`; revoke active same-`bindType` tokens only on regenerate
- **Expiry:** 1–90 days, default 7; JWT `expiresIn` and DB `expiresAt` aligned at generation
- **Endpoints:** `POST` / `GET` `/merchant/distributors/:id/qr`, `GET …/qr/:qrId/download`
- **RBAC:** owner-only generate; staff read history + download
- **Verify/claim:** reject revoked tokens before expiry check
- **Download:** server PNG via `qrcode` package (512×512 default)

## Files

| Path | Action |
|------|--------|
| `docs/architecture/phase-4-distributor-enhancements.md` | Expanded Slice 2 section (migration, APIs, tests) |
| `docs/handoffs/phase-4-distributor-slice2-architecture.md` | Created |
| `packages/shared/src/distributors.ts` | `GenerateQrRequest`, `QrHistoryListQuery/Response`, `id` on `GenerateQrResponse`, `computeQrStatus()` |

**Not modified (implementation phase):** Prisma migration, API services, merchant UI.

## Prisma migration

```bash
rtk pnpm --filter @meridian/api prisma:migrate -- --name distributor_qr_revoked_at
```

```sql
ALTER TABLE "DistributorQrCode" ADD COLUMN "revokedAt" TIMESTAMP(3);
CREATE INDEX "DistributorQrCode_distributorId_bindType_idx"
  ON "DistributorQrCode"("distributorId", "bindType");
```

No data backfill. Existing rows remain valid until regenerated.

## Endpoints

| Method | Path | Auth | RBAC |
|--------|------|------|------|
| `POST` | `/api/v1/merchant/distributors/:id/qr` | Merchant JWT | Owner |
| `GET` | `/api/v1/merchant/distributors/:id/qr` | Merchant JWT | Owner + Staff |
| `GET` | `/api/v1/merchant/distributors/:id/qr/:qrId/download` | Merchant JWT | Owner + Staff |

## Implementation checklist — Backend (`nestjs-backend`)

- [ ] Migration: `revokedAt` + `@@index([distributorId, bindType])`
- [ ] `pnpm add qrcode` + `@types/qrcode` in `@meridian/api`
- [ ] `qr-url.helper.ts` — `buildBindQrUrl(bindType, tenantSlug, token)`
- [ ] `GenerateQrDto` — `expiresInDays` with `@Min(1) @Max(90)`, default 7
- [ ] `DistributorsService.generateQr` — `assertOwner`, transactional revoke + create, return `id`
- [ ] `DistributorsService.listQrHistory` — paginate, filter `bindType`, map `QrHistoryEntry`
- [ ] `DistributorsService.downloadQrPng` — validate tenant/distributor/qr, render PNG
- [ ] `DistributorsController` — `GET :id/qr`, `GET :id/qr/:qrId/download` (declare before `GET :id` if needed)
- [ ] `BindingsService.verify` + `validateBindToken` — reject `revokedAt != null`
- [ ] `mock-prisma.ts` — `revokedAt` field, `updateMany` for qr codes
- [ ] E2E: regenerate revokes same bindType only; verify rejected; download PNG; staff 403 on POST

## Implementation checklist — Frontend (`nextjs-frontend`)

- [ ] `qr-display.tsx` — expiry selector (1–90, default 7); pass `expiresInDays` on POST
- [ ] Download button — authenticated fetch to `…/qr/{id}/download` → blob download
- [ ] `qr-history-table.tsx` — `GET …/qr` with status `Badge` (ACTIVE / EXPIRED / REVOKED)
- [ ] US-4.8 labels — Merchant partner vs Store customer on generate + history rows
- [ ] Staff UX — disable/hide Generate; allow history + download
- [ ] Distributor detail page — mount history table; optional SSR prefetch of history
- [ ] Update `GenerateQrResponse` consumer for new `id` field

## Test mapping (US-4.4)

| Criterion | Test |
|-----------|------|
| MERCHANT / CUSTOMER correct URL | E2E POST qr both bindTypes |
| Regenerate invalidates previous | verify old token `valid: false` |
| Download PNG | GET download content-type + size |
| Expiry settings | POST `expiresInDays: 30` |
| History active/expired/revoked | GET history after regenerate + time mock |

## Open questions

None — PRD #1 (revoke scope) and #2 (expiry bounds) resolved in architecture.

## Next agents

1. **nestjs-backend** — migration + endpoints + bindings revoke check
2. **nextjs-frontend** — QR panel, history table, download (parallel after migration contract frozen)
3. **test-engineer** — map US-4.4 P0 criteria after implementation
