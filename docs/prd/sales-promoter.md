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
| Sales promoter | `apps/distributor` | Share invite link/QR, view branches and earnings, apply for withdrawal |

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
| US-SP8 | As promoter, I self-create share codes and QR on distributor portal | P0 | **Given** portal-enabled platform promoter, **When** I open `/share` and generate a code, **Then** I get 6-char code, `{STORE}/open-shop?invite=` URL, and QR; history lists use count and revoke works. |
| US-SP9 | As promoter, I view branch sales and commission details with store name and order sequence | P0 | **Given** recruited branches and ledger entries, **When** I open branches/commissions, **Then** I see 30d + lifetime sales (branches) and store name, order sequence, order total (commissions). |
| US-SP10 | As promoter, I apply for withdrawal and see request history | P0 | **Given** available settled balance, **When** I submit withdrawal, **Then** request is PENDING; history shows PENDING/APPROVED/REJECTED with reviewed time. |
| US-SP11 | As admin, I view promoter funds summary and full withdrawal history | P0 | **Given** promoter detail, **When** I open funds/withdrawals sections, **Then** I see accrued/settled/available/pending totals and all withdrawal rows with link to filtered withdrawals list. |
| US-SP12 | As admin, I filter withdrawals by status and promoter | P0 | **Given** withdrawals in multiple states, **When** I filter by status or `distributorId`, **Then** list matches; approve = disburse confirm (no payment gateway). |

## Non-Goals

- Different rates for 1st vs 2nd order (P0 uses single `commissionRate`)
- Replacing `apps/merchant/register?invite=` (kept as secondary)
- Retroactive commission for guest orders after account link

## Related Documents

- `docs/architecture/sales-promoter.md`
- `docs/design/sales-promoter.md`
- `docs/PRODUCT.md`
