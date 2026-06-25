# Handoff: Phase 4 Distributor Enhancements — Discovery

**Agent:** product-manager  
**Date:** 2025-06-25  
**Branch:** TBD (`feature/phase-4-distributor-enhancements` from `develop`)

## Scope

Phase 4 (Discovery) complete for distributor channel enhancements. PRD closes the gap between Phase 1–2 API capabilities and operable channel sales for merchants, customers, and platform admins.

**In scope (P0):**

- Store customer bind flow fix (G-7) with correct portal URLs and store auth
- Merchant distributor performance dashboard (bindings, orders, commission)
- Merchant commission statements / payout visibility (read-only ledger)
- QR link management (regenerate, expiry, download, history, bind-type routing)
- Platform admin distributor metrics (G-3) and merchant detail enrichment (G-4)

**In scope (P1):**

- Notifications on new binding and attributed PAID orders
- Attributed orders on distributor detail and merchant orders views (G-11 alignment)
- Explicit merchant vs customer QR workflows (US-4.8)

**Explicitly deferred (P2):**

- Distributor hierarchy / tiers and split commissions (US-4.9)
- Distributor self-service portal (US-4.10)
- Real payout rails, SMS, fraud analytics, re-binding

## Files

- `docs/prd/phase-4-distributor-enhancements.md`
- `docs/handoffs/phase-4-distributor-discovery.md`

## Context from implementation review

| Area | Current state |
|------|----------------|
| Merchant UI | Distributors list/detail, QR display with regenerate, bindings table, `/bind/[token]` for MERCHANT |
| Store UI | `/s/[slug]/bind/[token]` exists; expects `distributorName`, `requiresAuth` from verify; claim uses store token but API requires merchant JWT |
| API | `bindings/verify` returns `{ valid, distributorId, bindType, expiresAt }`; `bindings/claim` guarded by `MerchantAuthGuard`; QR URLs always use `MERCHANT_APP_URL` |
| Commission | Accrues on PAID via `CommissionService`; ledger visible on admin settlements only |
| Admin | Dashboard falls back to hardcoded zeros; merchant detail expects enriched `distributors` payload |

## Open questions

1. Store bind auth contract — store JWT claim path vs dedicated store binding endpoint
2. QR invalidation semantics on regenerate (per bind type vs global)
3. QR expiry configurability bounds (default 7d)
4. Merchant "paid out" local state vs platform SETTLED-only visibility
5. In-app notifications: persistent inbox vs dashboard widget for P1
6. Performance dashboard placement (distributor detail only vs merchant home summary)
7. Notification recipients (owner only vs configurable)
8. Whether US-4.9 hierarchy must be pulled forward for a pilot tenant

## Next agent

**architect** — produce `docs/architecture/phase-4-distributor-enhancements.md` covering store bind auth, QR routing, merchant commission read APIs, analytics aggregation, platform dashboard metrics, notification jobs, and shared contracts in `packages/shared`.
