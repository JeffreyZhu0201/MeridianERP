# Gaps Wave 5 — Stock Transfers Test Handoff

## Scope

US-3.15 inter-warehouse transfers with audit trail (`TRANSFER_OUT` / `TRANSFER_IN`).

## Files

- `apps/api/prisma/schema.prisma` (`StockTransfer`, `StockTransferLine`)
- `apps/api/src/merchant/inventory/transfers.*`
- `apps/merchant/app/inventory/transfers/*`
- `apps/merchant/lib/i18n/inventory-zh.ts`
- `apps/api/test/inventory-transfers.e2e-spec.ts`

## P0 acceptance

| Criterion | Test | Status |
|-----------|------|--------|
| Create transfer decrements source, increments dest | `inventory-transfers.e2e-spec.ts` | PASS |
| Reject over-transfer | `inventory-transfers.e2e-spec.ts` | PASS |
| Merchant UI list + new form | Manual / merchant Playwright | PASS |

## Open questions

- Transfer status workflow is single-step COMPLETED (no draft/cancel v2).

## Next agent

Wave 6 distributor portal.
