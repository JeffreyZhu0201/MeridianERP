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
| GET | `/platform/distributors/:id/funds-summary` | `accruedTotal`, `settledTotal`, `pendingWithdrawals`, `availableBalance`, `branchCount` |
| GET | `/platform/distributors/:id/withdrawals` | All withdrawal requests for promoter |
| POST | `/platform/distributors/:id/invite-code` | URL uses `STORE_APP_URL/open-shop?invite=` |
| GET | `/platform/withdrawals` | Query: `status?`, `distributorId?`, `page?`, `limit?` → `WithdrawalRequestRow[]` |
| POST | `/platform/withdrawals/:id/approve` | Disburse confirm; updates `APPROVED` + `reviewedAt` |
| POST | `/platform/withdrawals/:id/reject` | Body `{ reason }` |

### Distributor portal (`apps/distributor`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/distributor/me/invite-codes` | Distributor JWT | List codes with `url`, `useCount`, `revokedAt` |
| POST | `/distributor/me/invite-codes` | Distributor JWT | Generate code (shared `RecruitInviteCodesService`) |
| POST | `/distributor/me/invite-codes/:codeId/revoke` | Distributor JWT | Revoke own code |
| GET | `/distributor/me/branches` | Distributor JWT | 30d + lifetime sales/order counts |
| GET | `/distributor/me/commissions` | Distributor JWT | Includes `businessName`, `customerOrderSequence`, `orderTotal` |
| GET/POST | `/distributor/me/withdrawals` | Distributor JWT | List history; create request |

Portal auth requires `tenantId: null`, `portalEnabled`, `isActive`.

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

`packages/shared/src/phase-5-distribution.ts`:

- `DistributorInviteCodeRow` — portal invite list item with `url`, `createdAt`
- `DistributorFundsSummary` — promoter funds snapshot
- `WithdrawalListQuery` — admin list filters
- `CommissionStatementRow.businessName`, `customerOrderSequence` (in `distributors.ts`)

## Module Layout

- `apps/api/src/recruit-invite/recruit-invite.service.ts` — invite validation
- `apps/api/src/recruit-invite/recruit-invite-codes.service.ts` — create/list/revoke + URL builder (admin + portal)
- `apps/api/src/store/merchant-application/` — store onboarding API
- `apps/store/app/open-shop/` — wizard UI
- `apps/distributor/app/share/` — self-service share + QR
