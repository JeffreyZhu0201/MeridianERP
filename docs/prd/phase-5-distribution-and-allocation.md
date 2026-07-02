# Phase 5 — HQ Branch Channel & Factory Allocation

**Version:** 2.0  
**Last updated:** 2025-06-25  
**Status:** Complete; retained as shipped Phase 5 product reference  
**Depends on:** Phase 1–4 (auth, store commerce, inventory, distributor portal shell), Bento UI (US-5.1 store picker delivered)

## Revision summary (v1 → v2)

| Topic | v1 | v2 |
|-------|----|----|
| Distributor scope | Tenant-scoped; merchant CRUD | **Platform-level** B2B channel partners; **Admin CRUD only** |
| Distributor role | Customer-facing QR bind + downline tree | **Recruit branch stores (merchants)** only; no terminal-customer attribution |
| Commission source | `order.distributorId` from customer binding | `MerchantProfile.recruitedByDistributorId` on **branch sales** |
| Commission trigger | Order `PAID` | Order **`FULFILLED`** (pickup verify or HQ ship) |
| Withdrawal approval | Merchant | **Platform Admin** |
| Inventory on pay | Decrement branch stock on `PAID` | **No decrement on `PAID`**; pickup verify → branch stock; delivery ship → MasterSku |
| Epic F | — | Pickup/delivery fulfillment, HQ delivery queue, shared `OrderListFrame` |

**Deprecated (do not implement):** merchant distributor CRUD; customer QR commission attribution; customer promotion toggle; pay-on-`PAID` inventory decrement for pickup orders; multi-level distributor tree in P0.

---

## Problem

MeridianERP Phase 1–4 implemented **tenant-scoped distributors**, **customer QR binding**, and **commission on `order.distributorId` at payment**. That model fits flat referral marketing, not a **factory → branch store → consumer** operating model.

Real HQ operations require:

- **Platform (factory)** owns master catalog, allocation to branches, channel partner management, withdrawal approval, and **HQ-shipped delivery orders**.
- **Channel partners (distributors)** are **B2B agents** who recruit **branch stores** — they do not sell to or bind end customers.
- **Branch stores (merchants)** sell to consumers, hold branch inventory after allocation, **verify pickup orders**, and view branch funds — they do **not** manage distributors.
- **Consumers** choose a store (US-5.1 ✅), checkout with **pickup or delivery**, and receive pickup verification credentials when applicable.

Without Phase 5 v2, the platform cannot attribute branch GMV to recruiting channel partners, operate HQ delivery vs branch pickup correctly, or run factory allocation and fund reporting.

---

## Users

| Persona | Portal | Goals |
|---------|--------|-------|
| **Platform Super Admin / Ops** | `apps/admin` | Master SKUs, allocation to branches, CRM, channel partner CRUD, merchant approval with distributor binding, delivery queue & ship, withdrawal approval, platform funds |
| **Platform Ops (read-only)** | `apps/admin` | View orders, inventory, funds per RBAC |
| **Channel partner (distributor)** | `apps/distributor` | Recruit branches via invite, view recruited branches and sales, track commission, request withdrawal |
| **Branch owner / staff** | `apps/merchant` | Sell, verify pickup orders, request replenishment, view branch funds — **no distributor management** |
| **End customer** | `apps/store` | Pick store, shop, choose pickup or delivery, pay, show pickup QR/code at branch |

---

## Business model

```
                    ┌─────────────────────────────────────┐
                    │     Platform / Factory (Admin)       │
                    │  MasterSku · Allocation · CRM        │
                    │  Channel partners · Withdrawals      │
                    │  Delivery queue (DELIVERY orders)    │
                    └──────────────┬──────────────────────┘
                                   │ allocates goods
                                   │ approves branches
                    ┌──────────────▼──────────────────────┐
                    │   Channel partner (Distributor)      │
                    │   B2B only — recruits branch stores  │
                    │   Earns % of recruited branch GMV    │
                    └──────────────┬──────────────────────┘
                                   │ invite → register → approved
                    ┌──────────────▼──────────────────────┐
                    │   Branch store (Merchant tenant)     │
                    │   recruitedByDistributorId           │
                    │   Sales · pickup verify · funds      │
                    └──────────────┬──────────────────────┘
                                   │ sells to
                    ┌──────────────▼──────────────────────┐
                    │   End customer (Store)               │
                    │   PICKUP @ branch · DELIVERY @ HQ    │
                    └─────────────────────────────────────┘
```

**Locked decisions**

| Topic | Decision |
|-------|----------|
| Currency | CNY, 2 decimal places (`Decimal(12,2)`) |
| Distributor hierarchy | P0: **single level** — one `recruitedByDistributorId` per branch; no downline tree |
| Commission basis | Branch order GMV (`Order.total`) when order reaches **`FULFILLED`** |
| Withdrawal MVP | Request + **Admin** approve/reject only; no bank / WeChat / Stripe disbursement |
| Legacy data | Existing tenant-scoped distributors and `order.distributorId` commissions are **not retroactively recalculated** |
| US-5.1 store picker | **Done** — `GET /store/stores`, `apps/store` `/` |

---

## Fund formulas (CNY, 2 dp)

All amounts rounded half-up to 2 decimal places at persistence boundaries.

### Branch (merchant tenant)

```
branch_GMV           = Σ Order.total
                       WHERE tenantId = branch
                         AND status IN (PAID, FULFILLED)
                         AND paidAt IS NOT NULL

branch_allocation_cost = Σ (line.quantity × MasterSku.wholesalePrice)
                       WHERE AllocationOrder.tenantId = branch
                         AND status = CONFIRMED

branch_delivery_cost   = Σ (line.quantity × MasterSku.wholesalePrice)
                       WHERE DeliveryAllocationLedger.tenantId = branch
                         AND order.status = FULFILLED
                         AND order.fulfillmentType = DELIVERY

branch_payable_commission = Σ CommissionLedger.amount
                       WHERE related orders.tenantId = branch
                         AND status IN (ACCRUED, SETTLED)

branch_net_estimate  = branch_GMV
                       − branch_allocation_cost
                       − branch_delivery_cost
                       − branch_payable_commission
```

### Channel partner (distributor)

```
commission_per_order = IF commissionType = PERCENT
                         THEN order.total × (commissionRate / 100)
                       ELSE commissionRate   -- FIXED per fulfilled order

distributor_accrued  = Σ CommissionLedger.amount WHERE status = ACCRUED
distributor_settled  = Σ CommissionLedger.amount WHERE status = SETTLED
distributor_withdrawn = Σ WithdrawalRequest.amount WHERE status = APPROVED

distributor_available = distributor_settled − distributor_withdrawn
                        − Σ WithdrawalRequest.amount WHERE status = PENDING
                        (reserve-on-pending vs validate-on-approve: architect decides)
```

### Platform (Admin)

```
platform_GMV         = Σ Order.total WHERE status IN (PAID, FULFILLED)

platform_wholesale_revenue = branch_allocation_cost (all branches)
                           + branch_delivery_cost (virtual allocation on delivery ship)

platform_commission_liability = Σ CommissionLedger.amount
                                WHERE status IN (ACCRUED, SETTLED)

platform_pending_withdrawals  = Σ WithdrawalRequest.amount WHERE status = PENDING
```

---

## User stories

### Epic A — Unified store entry (`apps/store`)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-5.1 | As an **end customer**, I want a single page with a store picker so that I can choose where to shop without memorizing slugs | **P0** ✅ **Done** | **Given** I open `/`, **When** the page loads, **Then** I see a searchable list of approved stores (name + slug). **Given** I select a store, **When** I confirm, **Then** I navigate to `/s/{slug}`. **Given** I selected a store before, **When** I return within 30 days on the same browser, **Then** my last selection is pre-selected (localStorage). **Given** no stores exist, **When** I open `/`, **Then** I see an empty state, not an error. |
| US-5.2 | As an **end customer**, I want direct store URLs to keep working so that shared links remain valid | **P0** | **Given** a valid tenant slug, **When** I open `/s/{slug}` directly, **Then** the catalog loads as today. **Given** I arrived via `/s/{slug}`, **When** I visit `/`, **Then** the picker reflects current slug context where applicable. |

### Epic B — Platform channel partners & branch recruitment (`apps/admin`, merchant onboarding, API)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-5.3 | As a **platform admin**, I want to create and manage channel partner distributors so that the factory controls the sales network | **P0** | **Given** admin auth, **When** I open Distributors, **Then** I see platform-level partners with name, contact, commission rate/type, portal enabled, active status, and recruited branch count. **Given** I create a partner, **When** I save valid fields, **Then** a platform-scoped `Distributor` is created (not tied to a merchant tenant). **Given** I deactivate a partner, **When** saved, **Then** new branch invites are invalid and no new commission accrues until reactivated. **Given** merchant auth, **When** I call former merchant distributor APIs, **Then** the request is rejected (403 or route removed). |
| US-5.4 | As a **platform admin**, I want to generate a 6-character branch-recruitment invite code for a channel partner so that they can share a simple signup link | **P0** | **Given** an active channel partner `D`, **When** I generate a branch-recruit code, **Then** the code is exactly 6 characters `A–Z`, unique platform-wide, tied to `D`. **Given** a code, **When** I copy the share link, **Then** the URL is `{MERCHANT_APP_URL}/register?invite={CODE}`. **Given** the registration page opens with `invite`, **When** the form renders, **Then** the invite field is auto-filled and read-only. **Given** I revoke a code, **When** someone uses it, **Then** onboarding fails with "invite invalid or revoked". |
| US-5.5 | As a **prospective branch owner**, I want to register with a channel partner invite code so that my store is linked to the recruiter pending approval | **P0** | **Given** a valid branch-recruit code for partner `D`, **When** I complete merchant registration with the invite, **Then** onboarding stores pending `recruitedByDistributorId = D`. **Given** I submit without a valid invite, **When** architect requires invite for channel onboarding, **Then** registration fails or proceeds unbound per architecture default (default: invite optional for organic signup, required when link includes code). **Given** I already have a submitted application, **When** I reuse the same invite on a duplicate email, **Then** I see a clear conflict error. |
| US-5.6 | As a **platform admin**, I want to assign or change the recruiting channel partner when reviewing a branch application so that binding is auditable | **P0** | **Given** a merchant in `UNDER_REVIEW`, **When** I approve, **Then** I can confirm or override `recruitedByDistributorId` (including none). **Given** I change the partner on an approved branch, **When** I save with reason, **Then** the new binding applies to **future** fulfilled orders only. **Given** approval completes, **When** the partner opens their portal, **Then** the branch appears in their recruited-branch list. |
| US-5.7 | As a **platform admin**, I want to set commission rate and type per channel partner so that incentives differ by agent | **P0** | **Given** partner `D`, **When** I set `PERCENT` (0–100) or `FIXED` per order, **Then** the rate is stored with effective timestamp and actor. **Given** a fulfilled order from a branch recruited by `D`, **When** commission accrues, **Then** amount follows US-5.7 rate at fulfillment time. **Given** I update the rate, **When** the next order fulfills, **Then** the new rate applies; prior ACCRUED entries are unchanged. |
| US-5.8 | As a **registrant**, I want invite codes validated at merchant onboarding so that invalid codes fail before account creation | **P0** | **Given** invite code valid for partner `D`, **When** I register with that code, **Then** validation succeeds and pending binding is stored. **Given** revoked or unknown code, **When** I submit, **Then** validation fails with a field-level error before password is persisted. **Given** brute-force attempts, **When** rate limit is exceeded, **Then** requests are throttled per architecture. |

### Epic C — Distributor portal & withdrawals (`apps/distributor`, `apps/admin`)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-5.10 | As a **channel partner**, I want to see my recruited branches and effective commission terms so that I understand my portfolio | **P0** | **Given** distributor JWT, **When** I open Branches, **Then** I see each recruited branch (name, slug, status, 30-day GMV, lifetime GMV). **Given** I view my profile, **When** loaded, **Then** I see my commission rate/type set by Admin. **Given** no recruited branches, **When** I view the list, **Then** I see an empty state with invite guidance (read-only link from Admin-issued code). |
| US-5.11 | As a **channel partner**, I want commission totals by status so that I know what I have earned | **P0** | **Given** distributor JWT, **When** I view earnings, **Then** I see accrued, settled, withdrawn (or available), matching fund formulas. **Given** ledger entries exist, **When** I drill in, **Then** I see read-only lines (order ref, branch name, amount, date, status) scoped to my `distributorId`. |
| US-5.12 | As a **channel partner**, I want to submit a withdrawal request so that I can receive offline payout after Admin approval | **P0** | **Given** available balance ≥ minimum (platform-configurable, default > 0 CNY), **When** I submit amount `A` and optional note, **Then** a `WithdrawalRequest` is created in `PENDING`. **Given** `A` exceeds available balance, **When** I submit, **Then** validation fails. **Given** a pending request, **When** I submit another, **Then** behavior is reject-or-queue per architecture (documented). **No payment API is called.** |
| US-5.13 | As a **platform admin**, I want to review channel partner withdrawal requests so that I can approve offline payouts | **P0** | **Given** admin auth, **When** I open Withdrawals, **Then** I see `PENDING` items with partner, amount, date, note. **Given** a pending request, **When** I approve, **Then** status becomes `APPROVED`, ledger reflects withdrawal, partner balance updates. **Given** I reject with reason, **When** saved, **Then** status is `REJECTED`, any reserved balance is released, partner sees reason. **Merchant portal has no withdrawal approval UI.** |

### Epic D — Factory master data & allocation (`apps/admin`, `apps/merchant`)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-5.14 | As a **platform admin**, I want CRM (contacts, companies, leads) so that I can manage factory B2B relationships | **P0** | **Given** admin auth, **When** I use platform CRM modules, **Then** I can CRUD contacts, companies, and leads scoped to the platform. **Given** merchant tenant CRM data, **When** I search platform CRM, **Then** merchant records never appear. **Given** pipeline stages, **When** I update a lead, **Then** transitions follow `NEW` → `QUALIFIED` → `WON` \| `LOST`. |
| US-5.15 | As a **platform admin**, I want a master product catalog so that I control cost, pricing, and HQ stock | **P0** | **Given** admin auth, **When** I CRUD master SKUs, **Then** each record includes name, SKU code (unique platform-wide), on-hand inventory, cumulative shipped quantity, unit cost, wholesale price (下级拿货价), retail price (最终售价), and active flag. **Given** list views, **When** I filter, **Then** results paginate. **Given** invalid numerics, **When** I save, **Then** field-level validation errors appear. |
| US-5.16 | As a **platform admin**, I want to create store allocation orders so that I ship goods to branch stores | **P0** | **Given** an approved branch tenant, **When** I create an allocation with line items (master SKU + quantity), **Then** status starts `DRAFT` or `ISSUED` per workflow. **Given** `ISSUED`, **When** branch confirms receipt, **Then** status becomes `CONFIRMED`, branch sellable stock increases, and `branch_allocation_cost` includes wholesale × qty. **Given** insufficient factory on-hand, **When** I issue, **Then** the operation fails with a clear error. |
| US-5.17 | As a **branch owner**, I want to submit replenishment requests to the factory so that I can restock | **P0** | **Given** merchant auth, **When** I create a replenishment request with master SKUs and quantities, **Then** status is `PENDING`. **Given** admin approves, **When** saved, **Then** status is `APPROVED` and optionally spawns an allocation order (US-5.16). **Given** rejected, **When** I view the request, **Then** rejection reason is visible. |

### Epic E — Funds reporting (`apps/admin`, `apps/merchant`)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-5.9 | As a **platform admin**, I want a funds dashboard so that I see GMV, wholesale revenue, commission liability, and pending withdrawals | **P0** | **Given** admin auth, **When** I open Funds, **Then** I see KPI tiles matching platform fund formulas and a trend chart (≥ 7 days when data exists). **Given** I filter by date range, **When** applied, **Then** totals recompute for that window. **Given** no orders yet, **When** I load the page, **Then** zeros and empty chart state render without error. |
| US-5.18 | As a **branch owner**, I want a branch funds view so that I see sales, allocation cost, delivery cost, payable commission, and net estimate | **P0** | **Given** merchant auth, **When** I open Funds, **Then** I see branch fund formula fields in CNY 2 dp. **Given** fulfilled orders and confirmed allocations exist, **When** loaded, **Then** figures reconcile with underlying orders and allocation records. **Given** no activity, **When** loaded, **Then** I see zeros and helper copy, not errors. |

### Epic F — Order fulfillment: pickup & delivery (`apps/store`, `apps/merchant`, `apps/admin`, `packages/ui`)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-5.19 | As an **end customer**, I want to choose pickup or delivery at checkout so that I receive my order the way I prefer | **P0** | **Given** checkout, **When** I proceed, **Then** I must select `PICKUP` or `DELIVERY`. **Given** `DELIVERY`, **When** I submit, **Then** I provide a valid delivery address (name, phone, address lines). **Given** payment succeeds, **When** the order is created, **Then** `fulfillmentType` is persisted and **branch inventory is not decremented on `PAID`**. |
| US-5.20 | As an **end customer** with a pickup order, I want a verification code and QR on the confirmation page so that the branch can verify my pickup | **P0** | **Given** a `PAID` + `PICKUP` order, **When** I open confirmation or order detail, **Then** I see a 6-digit pickup code and scannable QR (signed payload with order id + code). **Given** the order is not yet paid, **When** I view confirmation, **Then** credentials are hidden. **Given** already verified, **When** I view the page, **Then** I see fulfilled status, not active codes. |
| US-5.21 | As **branch staff**, I want a pending-pickup order list so that I can fulfill in-store pickups | **P0** | **Given** merchant auth, **When** I open Orders (pickup tab or `/orders/pickup`), **Then** I see `PAID` + `PICKUP` + unverified orders with code hint, customer name, total, and created time. **Given** I open verify action, **When** the dialog opens, **Then** I can scan QR or type the 6-digit code. |
| US-5.22 | As **branch staff**, I want pickup verification to decrement branch inventory idempotently so that stock matches physical handover | **P0** | **Given** valid code for a pending pickup order, **When** I confirm verify, **Then** order becomes `FULFILLED`, `pickupVerifiedAt` is set, branch default-warehouse stock decrements by line quantities, and commission accrues per Epic B/C rules. **Given** the same code again, **When** I retry, **Then** the operation is idempotent (no double decrement). **Given** wrong code, **When** I submit, **Then** validation fails without state change. |
| US-5.23 | As a **platform admin**, I want a delivery order queue so that HQ can fulfill shipped orders | **P0** | **Given** admin auth, **When** I open Orders with delivery filter, **Then** I see `PAID` + `DELIVERY` orders awaiting ship with branch, customer, address, line items, and totals. **Given** I open an order, **When** detail loads, **Then** delivery address and fulfillment status are visible. |
| US-5.24 | As a **platform admin**, I want to mark a delivery order shipped so that HQ inventory decreases and branch delivery cost is recorded | **P0** | **Given** a `PAID` + `DELIVERY` order, **When** I confirm ship, **Then** order becomes `FULFILLED`, `shippedAt` is set, MasterSku on-hand decrements by line quantities, a delivery allocation ledger entry records wholesale cost to the branch, and commission accrues. **Given** insufficient MasterSku stock, **When** I ship, **Then** the operation fails with a clear error. |
| US-5.25 | As a **developer**, I want a shared `OrderListFrame` in `@meridian/ui` so that admin and merchant order lists stay consistent | **P0** | **Given** admin and merchant order pages, **When** rendered, **Then** both use `OrderListFrame` with configurable columns, status badges, fulfillment type badges, pagination, and empty states aligned with `packages/ui`. **Given** pickup and delivery contexts, **When** tabs/filters differ, **Then** the frame accepts slot props without duplicating table chrome. |

---

## Release slices

| Slice | Stories | Outcome | Depends on |
|-------|---------|---------|------------|
| **S1** | US-5.3, US-5.7; schema migration; commission on `recruitedByDistributorId` at `FULFILLED`; disable merchant distributor APIs | Platform channel partners exist; new fulfilled orders accrue commission to branch recruiter; merchant `/distributors` unreachable | Architecture doc |
| **S2** | US-5.4, US-5.5, US-5.6, US-5.8, US-5.10 | Branch invite registration → admin approval → partner sees recruited branches | S1 |
| **S3** | US-5.14, US-5.15, US-5.16, US-5.17, US-5.9, US-5.18 | Platform CRM, master catalog, allocation/replenishment, admin + branch funds dashboards | S1 |
| **S4** | US-5.11, US-5.12, US-5.13 | Distributor earnings + withdrawal request + admin approval loop | S1, S2 |
| **S5** | US-5.19–US-5.25; remove pay-on-`PAID` branch decrement | Pickup verify + HQ delivery ship + shared order UI; inventory matrix correct | S3 (MasterSku for delivery) |

**Already shipped (pre-S1):** US-5.1, US-5.2 (store picker + deep links via Bento / store-stores API).

---

## Non-goals

- **Real payout rails** — bank transfer, WeChat Pay, Stripe Connect, or automated disbursement
- **Merchant-managed distributors** — no create/edit/promote/invite in merchant portal
- **Customer-facing distributor binding** — no QR/JWT bind for commission; no customer promotion codes
- **Multi-level channel hierarchy** in P0 — no upline/downline tree or split commissions on one order
- **Pay-on-`PAID` branch inventory decrement** for any fulfillment type (replaced by Epic F rules)
- **Replacing tenant `Product` catalog** — master SKUs sync or map via allocation; branches may maintain storefront products
- **International multi-currency, tax, invoicing**
- **SMS / push notifications** for invite, pickup, or withdrawal (email optional P1)
- **Fraud analytics** beyond rate limiting on invite and pickup verification
- **Re-binding recruited branch to another partner** with retroactive commission adjustment
- **Barcode scanning hardware integration** beyond camera QR in browser (P2)
- **Carrier tracking integrations** for delivery (P2)
- **Retroactive recomputation** of legacy `order.distributorId` commissions

---

## Success metrics

| Metric | Target |
|--------|--------|
| Branch invite registration → approved bind success rate | ≥ 98% |
| Store picker → first product view (median) | < 3 clicks from `/` (US-5.1 baseline) |
| Pickup verify → `FULFILLED` without double stock decrement | 100% idempotent in e2e |
| Delivery ship → MasterSku decrement matches line qty | 100% in e2e |
| Commission accrual only after `FULFILLED` | 0 accruals on `PAID`-only orders in regression |
| Withdrawal request → admin action within 7 days | ≥ 80% (ops baseline) |
| Allocation request → admin decision median | < 3 business days |
| Factory allocation `CONFIRMED` → branch sellable qty visible | < 5 minutes |
| P0 stories covered by automated tests | 100% mapped per slice (API e2e + Playwright smoke) |

---

## Dependencies on architecture

The shipped architecture reference is `docs/architecture/phase-5-distribution-and-allocation.md`. This PRD is retained for acceptance criteria and product context.

1. Platform-scoped `Distributor` (`tenantId` nullable) and migration from legacy tenant-scoped rows
2. `MerchantProfile.recruitedByDistributorId` lifecycle (pending → approved → change rules)
3. `BranchRecruitInviteCode` entity, validation, revocation, brute-force protection
4. Commission accrual on `FULFILLED` from branch profile, not `order.distributorId`
5. `WithdrawalRequest` state machine and ledger interaction (reserve vs validate)
6. `MasterSku`, `AllocationOrder`, `ReplenishmentRequest`, `PlatformCrm*` isolation
7. Order fulfillment fields: `FulfillmentType`, pickup code/verify, delivery address, ship metadata
8. Inventory matrix: no decrement on `PAID`; pickup → branch warehouse; delivery → MasterSku
9. `DeliveryAllocationLedger` for virtual wholesale cost on delivery ship
10. Deprecation plan for `merchant/distributors/*`, customer bind commission paths, `markOrderPaidAndDecrement` for pickup
11. Shared Zod DTOs in `packages/shared` for all new contracts
12. RBAC for admin withdrawal, allocation, ship, and merchant verify-pickup

---

## Open questions

| # | Question | Owner | Notes |
|---|----------|-------|-------|
| 1 | Legacy tenant-scoped `Distributor` migration — merge, archive, or read-only flag? | Architect | No retroactive commission recompute |
| 2 | Organic branch signup without invite — allow unbound `recruitedByDistributorId`? | Product / Architect | PRD default: allowed; invite link pre-fills binding |
| 3 | Reserve balance on `PENDING` withdrawal vs validate on approve only? | Architect | Affects `distributor_available` formula |
| 4 | Master SKU → tenant `Product` on allocation confirm — auto-clone vs manual map? | Architect | |
| 5 | Minimum withdrawal amount and frequency limits? | Product | Default in architecture |
| 6 | Invite code single-use vs multi-use until revoked? | Product | Default: multi-use until revoked |
| 7 | Pickup code entropy — 6 numeric digits sufficient with rate limit? | Architect | |
| 8 | Delivery ship partial quantities / backorders? | Product | P0: full-ship only |
| 9 | Commission `SETTLED` vs `ACCRUED` transition — manual batch vs auto on fulfill? | Architect | Align with existing settlement batches |
| 10 | Published store list — all `APPROVED` merchants vs `storePublished` flag? | Product | US-5.1 uses `APPROVED` today |

---

## Related documents

| Document | Path |
|----------|------|
| Platform overview | `docs/PRODUCT.md` |
| Phase 4 distributors (legacy) | `docs/prd/phase-4-distributor-enhancements.md` |
| Phase 2 commission (legacy model) | `docs/prd/phase-2-ecommerce.md` |
| Phase 3 inventory | `docs/prd/phase-3-inventory.md` |
| Bento UI (US-5.1 delivered) | `docs/prd/bento-ui-redesign.md` |
| ERP domain rules | `.cursor/rules/backend.mdc` |
