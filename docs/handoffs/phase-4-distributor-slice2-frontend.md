# Phase 4 Slice 2 — QR Management Frontend Handoff

**Date:** 2025-06-25  
**Stories:** US-4.4, US-4.8  
**Architecture:** `docs/handoffs/phase-4-distributor-slice2-architecture.md`

## Handoff

- **Scope:** Merchant distributor QR panel — expiry selector, PNG download, paginated history with status badges, US-4.8 audience labels, staff read-only generate with history + download.
- **Ui-spec refs:** `Table` + `Badge` (orders-table / leads-table patterns), `Card` + `Select` + `Input` + `Button` (distributor QR card), `Badge` variants `success` / `secondary` / `destructive` for ACTIVE / EXPIRED / REVOKED.
- **Files:**
  - `apps/merchant/lib/distributors.ts` — `BIND_TYPE_LABELS`, `fetchQrHistory`, `downloadQrPng`, query builder
  - `apps/merchant/app/distributors/[id]/_components/qr-display.tsx` — expiry 1–90 days, `expiresInDays` on POST, download PNG, owner-only generate
  - `apps/merchant/app/distributors/[id]/_components/qr-history-table.tsx` — `GET …/qr`, status badges, audience filter, per-row PNG download
  - `apps/merchant/app/distributors/[id]/_components/distributor-detail.tsx` — mounts history table, `isOwner`, refresh on generate
  - `apps/merchant/app/distributors/[id]/page.tsx` — SSR prefetch QR history, `isMerchantOwner(token)`
- **Missing APIs:** Backend Slice 2 endpoints must land for E2E:
  - `POST /merchant/distributors/:id/qr` with `expiresInDays` + `id` in response
  - `GET /merchant/distributors/:id/qr` → `QrHistoryListResponse`
  - `GET /merchant/distributors/:id/qr/:qrId/download` → PNG blob
  - Staff `403` on POST (UI already hides generate for non-owners)
- **Next agent:** `nestjs-backend` (if not done) → `test-engineer` for US-4.4 P0 criteria

## Implementation Summary

### QR display (`qr-display.tsx`)

| Feature | Behavior |
|---------|----------|
| Expiry | Number input 1–90, default 7; sent as `expiresInDays` on POST |
| Audience | **Merchant partner** / **Store customer** (US-4.8) |
| Generate | Owner only; staff see read-only helper copy |
| Download | Authenticated fetch blob from `…/qr/{id}/download?format=png` |
| Regenerate | Owner only; triggers history table refresh via callback |

### QR history (`qr-history-table.tsx`)

| Column | Content |
|--------|---------|
| Audience | `Badge` with Merchant partner / Store customer |
| Status | ACTIVE (`success`), EXPIRED (`secondary`), REVOKED (`destructive`) |
| Created / Expires | Locale-formatted timestamps |
| Actions | Download PNG per row |

- Paginated (`page`, `limit=20`), optional `bindType` filter
- SSR prefetch on detail page; client refetch on generate + pagination

### RBAC (staff UX)

- `isMerchantOwner(token)` from JWT decode (API enforces auth)
- Staff: no audience/expiry controls, no generate buttons; history + download enabled
- Owner: full generate + regenerate + download

## Test plan (frontend)

- [ ] Owner generates MERCHANT QR with 30-day expiry → history shows ACTIVE row
- [ ] Owner regenerates same bindType → previous row REVOKED in history
- [ ] Download PNG from current QR panel and from history row
- [ ] Staff login: no Generate UI; history loads; download works
- [ ] Staff POST generate returns 403 (API) — UI must not expose button
- [ ] Audience labels show Merchant partner vs Store customer in generate + history
- [ ] History filter by audience works

## GitHub Handoff

- **Branch:** `feature/phase-4-distributor-enhancements` (base: `develop`)
- **PR:** ready after backend Slice 2 merges
- **CI:** run `rtk pnpm --filter @meridian/shared build` then merchant typecheck/build
- **Docs:** `docs/architecture/phase-4-distributor-enhancements.md`, slice 2 architecture + this handoff
