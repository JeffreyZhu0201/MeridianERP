# Sales Promoter (拓店员) — Architecture

**Updated:** 2026-07-03

## Model

Reuses platform-level `Distributor` (`tenantId: null`) as the sales promoter entity.

| Field | Change |
|-------|--------|
| `Distributor.accountId` | Optional FK → `PlatformAccount` (unique) |
| `CommissionLedger.customerOrderSequence` | `1` or `2` |
| `CommissionLedger.customerId` | Customer for reporting |

Existing recruitment fields unchanged: `MerchantProfile.recruitedByDistributorId`, `pendingRecruitInviteCode`, `MerchantRecruitInviteCode`.

## Commission Algorithm

On `Order.status → FULFILLED`:

1. Skip if `commissionEntry` exists
2. Load `MerchantProfile.recruitedByDistributorId`; require active platform distributor
3. Require `order.customerId`; skip guests (P0)
4. `priorCount = count(FULFILLED orders for tenantId + customerId excluding current)`
5. `sequence = priorCount + 1`; if `sequence > 2`, return
6. `amount = calculateAmount(order.total, distributor.commissionRate, commissionType)`
7. Create `CommissionLedger` with `customerOrderSequence`, `customerId`

Trigger points unchanged: pickup verify, HQ delivery ship (`fulfillment.service.ts`).

## API

### Platform (admin)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/platform/distributors` | Add optional `accountId` |
| GET | `/platform/distributors/:id/commission-entries` | Paginated ledger with branch name, sequence |
| POST | `/platform/distributors/:id/invite-code` | URL uses `STORE_APP_URL/open-shop?invite=` |

### Store

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/store/merchant-applications/invite/:code` | Public | Returns promoter display name |
| POST | `/store/merchant-applications` | Store JWT (`sub` = accountId) | Create + submit application |
| GET | `/store/merchant-applications/me` | Store JWT | Current application status |

### Merchant application flow

```
POST /store/merchant-applications
  → validate invite
  → assert account not MERCHANT_OWNER
  → assert no pending application for account
  → Tenant(draft slug) + MerchantProfile(DRAFT, pendingRecruitInviteCode) + User(MERCHANT_OWNER)
  → submit → SUBMITTED
```

Approval reuses `POST /platform/merchants/:id/approve`.

## Shared Types

`packages/shared/src/phase-5-distribution.ts`: `CreatePlatformDistributorRequest.accountId`, `DistributorCommissionEntry`, `InviteCodePreview`, `StoreMerchantApplicationRequest`.

## Module Layout

- `apps/api/src/recruit-invite/recruit-invite.service.ts` — shared invite validation
- `apps/api/src/store/merchant-application/` — store onboarding API
- `apps/store/app/open-shop/` — wizard UI
