# Sales Promoter (拓店员) — Product Requirements

**Status:** In implementation  
**Updated:** 2026-07-03

## Problem

Branch recruitment today uses the merchant portal (`/merchant/register?invite=`). Field sales staff (拓店员) need a consumer-facing entry: users scan a share code, apply to open a store from the store portal, and HQ approves. Commission should reward promoters for each customer's **first two fulfilled orders** at recruited branches, not all branch GMV.

## Users

| Persona | Portal | Goals |
|---------|--------|-------|
| Platform admin | `apps/admin` | Create promoters from existing users, set commission rate, review applications, view promoted stores and per-order commission |
| Prospective store owner | `apps/store` | Scan promoter code, register/login, submit store application |
| Sales promoter | `apps/distributor` (optional) | Share invite link, view branches and earnings |

## User Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-SP1 | As admin, I create a promoter from an existing platform user | P0 | **Given** a `PlatformAccount` not already linked to a distributor, **When** I create a promoter with `accountId` and rate, **Then** a platform `Distributor` is created with synced name/email/phone. |
| US-SP2 | As admin, I generate a share link for a promoter | P0 | **Given** an active promoter, **When** I generate an invite code, **Then** URL is `{STORE_APP_URL}/open-shop?invite={CODE}`. |
| US-SP3 | As a user, I apply to open a store after scanning a code | P0 | **Given** valid invite + store login, **When** I submit business info, **Then** application is `SUBMITTED` with `pendingRecruitInviteCode`. |
| US-SP4 | As admin, I approve a store application and bind the promoter | P0 | **Given** pending invite code, **When** I approve, **Then** `recruitedByDistributorId` is set and invite consumed. |
| US-SP5 | As admin, I create a store and assign a promoter directly | P0 | **Given** create-merchant form, **When** I select promoter, **Then** branch is approved with recruiter set. |
| US-SP6 | As admin, I view promoted stores and per-order commission | P0 | **Given** promoter detail, **When** I open commission tab, **Then** I see orders with sequence (1st/2nd), amount, and status. |
| US-SP7 | As platform, I accrue promoter commission only on 1st and 2nd fulfilled orders per customer per branch | P0 | **Given** recruited branch, **When** customer order 3+ is fulfilled, **Then** no new ledger entry. **Given** guest order without `customerId`, **Then** no commission (P0). |

## Non-Goals

- Different rates for 1st vs 2nd order (P0 uses single `commissionRate`)
- Replacing `apps/merchant/register?invite=` (kept as secondary)
- Retroactive commission for guest orders after account link

## Related Documents

- `docs/architecture/sales-promoter.md`
- `docs/design/sales-promoter.md`
- `docs/PRODUCT.md`
