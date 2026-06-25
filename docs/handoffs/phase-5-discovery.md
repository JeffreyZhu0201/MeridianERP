# Phase 5 Discovery Handoff

**Date:** 2025-06-25  
**Phase:** 1 — Discovery (product-manager)  
**Next:** architect

## Handoff

- **Scope**: Phase 5 PRD completed — distribution network (unified store, invite codes, hierarchy, withdrawal requests) and factory allocation (platform CRM, master catalog, store allocations, merchant replenishment requests). 18 user stories (US-5.1–US-5.18), 4 release slices, locked decisions on CNY/2dp and withdrawal request-only MVP.

- **Files**:
  - `docs/prd/phase-5-distribution-and-allocation.md` (new)
  - `docs/prd/platform-overview.md` (Phase 5 roadmap + links)

- **Open questions for architect** (must resolve in architecture doc):

  1. **Invite code model** — new `InviteCode` table vs extend `DistributorQrCode`; expiry, revocation, multi-use limits, brute-force protection
  2. **Hierarchy storage** — `parentDistributorId` + `DistributorCommissionOverride(distributorId, childId, rate)` sufficient for P0?
  3. **Multi-level commission** — P0 direct-parent accrual only vs N-level split on `PAID` orders
  4. **Master SKU → tenant Product** — auto-clone on allocation confirm vs manual mapping UI
  5. **Shipped quantity** — factory-global counter vs per-store; relationship to order `PAID` events
  6. **Withdrawal ledger** — `WithdrawalRequest` state machine; reserve balance on PENDING vs approve-time validation
  7. **Published store list API** — which tenants appear (`APPROVED` only vs `storePublished` flag); response fields
  8. **Customer promotion** — same `Distributor` entity vs separate `Promoter` type when Settings enabled
  9. **Platform CRM** — reuse merchant CRM module with `@BypassTenant()` vs isolated `PlatformCrm*` tables

  Additional product decisions (can default in architecture with PRD notes):
  - Q10: Upline distributors edit downline rates in distributor portal vs merchant-only
  - Q11: Minimum withdrawal amount / frequency
  - Q12: Invite code single-use vs multi-use until revoked

- **Next agent**: architect — produce `docs/architecture/phase-5-distribution-and-allocation.md` with API contracts in `packages/shared` outline, Prisma model sketch, and answers to the nine items above.

## Stakeholder decisions captured

| Topic | Decision |
|-------|----------|
| Invite audience | Merchant promotes users to distributors; generates 6-char codes for distributor recruitment; optional customer promotion via Settings (P1) |
| Withdrawal | Request + merchant approval only; no payment rails |
| Store UX | Single entry page with store dropdown; keep `/s/{slug}` deep links |
| Currency | CNY, 2 decimal places |

## Suggested implementation order

1. Slice 1: US-5.1, US-5.2, US-5.5, US-5.6, US-5.18
2. Slice 2: US-5.3, US-5.4, US-5.7, US-5.10–US-5.13
3. Slice 3: US-5.14–US-5.17
4. Slice 4: US-5.8, US-5.9 (P1)
