# Phase 5 PRD v2 Handoff

**Date:** 2025-06-25  
**Phase:** 1 — Discovery (product-manager)  
**Next:** architect

## Handoff

- **Scope**: Phase 5 PRD v2.0 completed — HQ branch channel model. Platform-level B2B channel partners recruit branch stores via invite; commission on branch GMV at `FULFILLED` via `MerchantProfile.recruitedByDistributorId`; Admin withdrawal approval; factory master SKU + allocation + replenishment (Epic D); pickup/delivery fulfillment with HQ delivery queue and shared `OrderListFrame` (Epic F, US-5.19–5.25). US-5.1 store picker marked done. Deprecated: merchant distributor CRUD, customer QR commission, pay-on-`PAID` pickup inventory decrement. **25 user stories**, **5 release slices (S1–S5)**, CNY fund formulas locked.

- **Files**:
  - `docs/prd/phase-5-distribution-and-allocation.md` (v2.0 overwrite)

- **Open questions for architect** (must resolve in architecture doc):

  1. Legacy tenant-scoped `Distributor` migration strategy (merge / archive / read-only)
  2. Organic branch signup without invite — allow null `recruitedByDistributorId`?
  3. Withdrawal balance reserve on `PENDING` vs validate on approve only
  4. Master SKU → tenant `Product` sync on allocation confirm (auto-clone vs manual map)
  5. Minimum withdrawal amount and frequency limits
  6. Branch-recruit invite code single-use vs multi-use until revoked
  7. Pickup code format and brute-force protection
  8. Delivery partial ship / backorders (PRD default: full-ship only in P0)
  9. Commission `ACCRUED` → `SETTLED` transition timing vs existing settlement batches
  10. Store list visibility (`APPROVED` only vs `storePublished` flag)

  Architecture must also document:

  - Fulfillment state machines: `PICKUP` (PAID → verify → FULFILLED), `DELIVERY` (PAID → ship → FULFILLED)
  - Inventory decrement matrix (no decrement on PAID; pickup → branch warehouse; delivery → MasterSku)
  - `DeliveryAllocationLedger` virtual wholesale cost on delivery ship
  - API contracts for `platform/distributors`, `platform/allocations`, `platform/withdrawals`, `platform/funds`, `platform/orders` ship, `merchant/funds`, `merchant/replenishment`, `merchant/orders` verify-pickup, `distributor/me/branches`, `distributor/me/withdrawals`, store checkout `fulfillmentType`
  - Deprecation of `merchant/distributors/*` and `order.distributorId` commission writes

- **Next agent**: architect — produce `docs/architecture/phase-5-distribution-and-allocation.md` with Prisma sketch, migration plan, API table, and answers to the ten items above; then `docs/handoffs/phase-5-architecture.md`.

## Stakeholder decisions captured (v2)

| Topic | Decision |
|-------|----------|
| Distributor scope | Platform-level B2B channel partners; Admin CRUD only |
| Recruitment | Invite codes → merchant `/register?invite=` → pending `recruitedByDistributorId` → Admin approval |
| Commission | Branch sales; recruiter from `MerchantProfile`; accrues on `FULFILLED` |
| Withdrawal | Request + **Admin** approval; no payment rails |
| Fulfillment | PICKUP (branch verify → stock) / DELIVERY (HQ ship → MasterSku + virtual allocation cost) |
| Inventory on pay | **No** branch decrement on `PAID` |
| Currency | CNY, 2 decimal places |
| US-5.1 | Done (store picker) |

## Recommended implementation order

1. **S1**: US-5.3, US-5.7 — schema, platform distributors, commission refactor, disable merchant distributors
2. **S2**: US-5.4, US-5.5, US-5.6, US-5.8, US-5.10 — branch invite + approval + partner branches view
3. **S3**: US-5.14–US-5.17, US-5.9, US-5.18 — factory catalog, allocation, funds dashboards
4. **S4**: US-5.11–US-5.13 — distributor earnings + withdrawal + admin approval
5. **S5**: US-5.19–US-5.25 — pickup/delivery fulfillment, shared order UI
