# Gaps Wave 0 — Discovery Handoff

## Scope

PRD, architecture, and UI design docs for platform settings, stock transfers (US-3.15), and distributor portal (US-4.10).

## Files

- `docs/prd/platform-settings.md`
- `docs/architecture/platform-settings.md`
- `docs/design/platform-settings.md`
- `docs/architecture/phase-3-stock-transfers.md`
- `docs/prd/distributor-portal.md`
- `docs/architecture/distributor-portal.md`

## P0 acceptance

| Item | Status |
|------|--------|
| Settings PRD covers merchant + admin partitions | PASS |
| Stripe secret boundary documented (env-only) | PASS |
| Transfer + distributor architecture contracts | PASS |

## Open questions

- Tenant-level Stripe Connect remains P2 (documented Non-Goal).
- Team invite v1: email + password only (no magic link).

## Next agent

Implementation waves 1–6 (`nestjs-backend`, `nextjs-frontend`).
