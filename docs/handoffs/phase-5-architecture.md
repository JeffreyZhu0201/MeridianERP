# Phase 5 Architecture Handoff

**Date:** 2025-06-25  
**Phase:** 2 — Architecture (architect)  
**Next:** ui-designer → nextjs-frontend + nestjs-backend (parallel after shared types)

## Handoff

- **Scope**: Complete HQ ↔ Branch channel architecture for Phase 5 — entity model (`Distributor.tenantId` nullable, `MerchantProfile.recruitedByDistributorId`, `BranchRecruitInviteCode`, `MasterSku`, `AllocationOrder`, `ReplenishmentRequest`, `WithdrawalRequest`, `PlatformCrm*`, `FulfillmentType`, `DeliveryAllocationLedger`), full API contract tables, commission on `FULFILLED` from recruiter attribution, inventory matrix (pickup → branch warehouse, delivery → master SKU, `PAID` no decrement), legacy distributor migration plan, and `packages/shared` DTO inventory.

- **Files**:
  - `docs/architecture/phase-5-distribution-and-allocation.md` (new)
  - `docs/handoffs/phase-5-architecture.md` (this file)
  - `packages/shared` — **to implement** (not yet created):
    - `src/phase-5-distribution.ts`
    - `src/phase-5-allocation.ts`
    - `src/phase-5-fulfillment.ts`
    - `src/phase-5-funds.ts`
    - `src/platform-crm.ts`
    - extend `src/enums.ts`, `src/store.ts`, `src/ecommerce.ts`, `src/index.ts`

- **Open questions**:
  1. **Platform merchant recruit codes** — architecture proposes `PlatformMerchantInviteCode` sibling table (ADR-5.9); confirm product naming in UI copy.
  2. **P1 customer-attributed commission** — `cart.distributorId` preserved but not credited in P0; confirm before enabling to avoid double-pay with `recruitedByDistributorId`.
  3. **`MERCHANT_STAFF` withdrawal approve** — default allowed; add `TenantSettings.staffCanApproveWithdrawals` if merchants need tighter RBAC.
  4. **Pickup `pickupCode` OTP** — P0 uses merchant-auth-only verify; OTP deferred.
  5. **Prisma migration ordering** — run expand-only migration before `PHASE5_FULFILLMENT_MODE=true` in staging.

- **Next agents**:
  - **ui-designer** — screens per PRD slices (store picker, invite registration, distributor portal branches/withdrawals, admin master SKU + allocation + ship queue, merchant verify-pickup, replenishment); reference `apps/ui-spec` bento patterns.
  - **nestjs-backend** + **nextjs-frontend** — implement after shared Zod/types land; start Slice 1 (store picker + invite registration) behind feature flag.
  - **test-engineer** — map P0 acceptance criteria to e2e in architecture testing table.

## Key breaking changes (flag-gated)

| Area | Before | After (`PHASE5_FULFILLMENT_MODE=true`) |
|------|--------|----------------------------------------|
| Commission | `PAID` + `order.distributorId` | `FULFILLED` + `MerchantProfile.recruitedByDistributorId` |
| Inventory | Decrement on `PAID` | Decrement on verify-pickup / ship |
| Checkout | No fulfillment choice | `fulfillmentType` required |

## Implementation order (aligned with PRD slices)

1. **Slice 1** — Shared types + Prisma migration (expand-only) + store picker API + `BranchRecruitInviteCode` + register bind
2. **Slice 2** — Distributor hierarchy, portal branches/uplines/withdrawals, merchant withdrawal review
3. **Slice 3** — Platform CRM, `MasterSku`, allocations, replenishment, ship + verify-pickup + fulfillment commission
4. **Slice 4** — Customer promotion (P1), QR coexistence tests

## Prisma migration checklist

- [ ] `Distributor.tenantId` nullable + `parentDistributorId`, `kind`
- [ ] `MerchantProfile.recruitedByDistributorId`, `storePublished`, `recruitedAt`
- [ ] `BranchRecruitInviteCode`, `PlatformMerchantInviteCode`
- [ ] `DistributorCommissionOverride`, `WithdrawalRequest`
- [ ] `MasterSku`, `AllocationOrder*`, `ReplenishmentRequest*`
- [ ] `PlatformCrmCompany`, `PlatformCrmContact`, `PlatformCrmLead`, `PlatformCrmActivity`
- [ ] `Order.fulfillmentType`, `fulfillmentStatus`, ship/pickup audit fields
- [ ] `DeliveryAllocationLedger`
- [ ] `ProductVariant.masterSkuId`
- [ ] Backfill scripts: `storePublished`, `recruitedByDistributorId` from MERCHANT bindings
