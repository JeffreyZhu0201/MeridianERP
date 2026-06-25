# Phase 5 — Distribution Network & Factory Allocation

**Version:** 1.0  
**Last updated:** 2025-06-25  
**Status:** Discovery complete — ready for architecture  
**Depends on:** Phase 1 (distributors, bindings), Phase 2 (store auth, commission ledger), Phase 3 (merchant inventory), Phase 4 (distributor portal, commission visibility)

## Problem

MeridianERP today supports **flat distributors per tenant**, **QR JWT binding**, and **tenant-owned product catalogs**. Real factory-to-store operations need a different model:

- **Consumers** should land on **one storefront** and pick which shop to buy from, not memorize per-tenant URLs.
- **Merchants** need to **recruit and manage a distributor tree** with **per-downline commission rates**, using **short invite codes** (6 uppercase letters in the registration URL) instead of only expiring QR tokens.
- **Distributors** need a self-service view of **upline relationships**, **effective commission rates**, **earnings totals**, and a **withdrawal request** workflow (approval only — no payout rails in MVP).
- **Platform operators (factory)** need **platform-level CRM**, a **master product catalog** (cost, wholesale price, retail price, shipped quantity, stock), **allocation to merchant stores**, while **merchants request replenishment** from the factory.

Without Phase 5, merchants cannot run hierarchical channel sales, distributors cannot see uplines or request payouts, and the platform cannot centrally manage goods and store allocations.

## Users

| Persona | Goals |
|---------|-------|
| **Platform Super Admin / Ops** | Run factory CRM, maintain master SKUs, allocate stock to stores, oversee channel health |
| **Merchant Owner** | Manage distributor list, promote users, issue invite codes, set downline rates, approve withdrawals, request allocations |
| **Merchant Staff** | Support distributors, process withdrawal and allocation requests (RBAC per architect) |
| **Distributor Agent** | Register via invite link, bind to upline, view earnings and uplines, submit withdrawal requests |
| **End Customer** | Choose a store from one entry page, shop, register; optionally promote if merchant enables it (P1) |

## Business Model (locked for PRD)

```
Platform (factory) ──allocates──▶ Merchant store (tenant)
                                        │
                                        ├── Distributor tree (invite codes)
                                        └── End customers (orders → commission)
```

- **Currency:** CNY, 2 decimal places for all monetary fields unless architect extends.
- **Withdrawal MVP:** Request + merchant review only; no bank/WeChat/Stripe disbursement.
- **Customer promotion:** Off by default; merchant enables in Settings (US-5.3).

## User Stories

### Epic A — Unified store entry (`apps/store`)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-5.1 | As an **end customer**, I want a single page with a store dropdown so that I can choose where to shop without knowing each slug | **P0** | **Given** I open the store app root (`/`), **When** the page loads, **Then** I see a dropdown (or searchable select) of published stores with display name and slug. **Given** I select a store, **When** I confirm, **Then** I navigate to `/s/{slug}` (or equivalent in-app shop view). **Given** I selected a store before, **When** I return within 30 days on the same browser, **Then** my last selection is pre-selected (localStorage). **Given** no published stores exist, **When** I open `/`, **Then** I see an empty state with guidance, not an error. |
| US-5.2 | As an **end customer**, I want direct store URLs to keep working so that shared links remain valid | **P0** | **Given** a valid tenant slug, **When** I open `/s/{slug}` directly, **Then** the catalog loads as today. **Given** I arrived via `/s/{slug}`, **When** I visit `/`, **Then** the dropdown reflects the current slug context where applicable. |

### Epic B — Invite codes & distributor hierarchy (`apps/merchant`, API)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-5.3 | As a **merchant owner**, I want a Settings toggle for customer promotion so that I control whether ordinary customers can refer others | **P0** | **Given** tenant settings, **When** I view Distribution settings, **Then** I see "Allow customer promotion" default **off**. **Given** the toggle is off, **When** a customer attempts to use a customer-type invite code, **Then** registration fails with a clear message. **Given** I turn it on and save, **When** a new customer obtains a promotion code (P1 flow), **Then** referrals are accepted per US-5.8. |
| US-5.4 | As a **merchant owner**, I want a distributor management list so that I can promote users and manage agent status | **P0** | **Given** merchant auth, **When** I open Distributors management, **Then** I see all distributors with name, email/phone, parent (if any), status (active/inactive), default commission, and downline count. **Given** a registered store customer who is not yet a distributor, **When** I promote them, **Then** a distributor record is created linked to that customer account. **Given** an active distributor, **When** I deactivate them, **Then** new invite codes they issued are invalid and they cannot accrue new commission until reactivated. |
| US-5.5 | As a **merchant owner**, I want to generate a 6-character uppercase invite code for a distributor to recruit downlines so that sharing is simple | **P0** | **Given** an active distributor, **When** I generate a distributor-recruitment code, **Then** the code is exactly 6 characters `A–Z`, unique within the tenant, and tied to that distributor as inviter. **Given** a generated code, **When** I copy the share link, **Then** the URL is `{STORE_APP_URL}/s/{tenantSlug}/register?invite={CODE}` (path variant `/register/{CODE}` acceptable if architect standardizes one). **Given** the registration page opens with `invite` in the query or path, **When** the form renders, **Then** the invite field is auto-filled and read-only. **Given** I revoke a code, **When** someone uses it, **Then** registration fails with "invite invalid or expired". |
| US-5.6 | As a **new distributor recruit**, I want to register with an invite code so that I am automatically bound to my upline | **P0** | **Given** a valid distributor-recruitment code for tenant `T` and inviter `D`, **When** I complete store registration at `/s/{slug}/register` with matching slug for `T`, **Then** a distributor profile is created for me with `parentDistributorId = D` (or equivalent hierarchy link). **Given** I already have a distributor profile in tenant `T`, **When** I submit the same invite, **Then** I see a conflict error (no silent re-parent). **Given** slug does not match the code's tenant, **When** I register, **Then** the request is rejected. |
| US-5.7 | As a **merchant owner** (or upline distributor if RBAC allows), I want to set a custom commission rate for a direct downline so that incentives differ by agent | **P0** | **Given** distributor `P` with direct downline `C`, **When** I set an override rate (PERCENT 0–100 or FIXED per tenant rules), **Then** the override is stored with effective timestamp and actor. **Given** an override exists, **When** an attributed order completes for sales credited to `C`, **Then** commission uses the override rate instead of `C`'s default or tenant default. **Given** I remove the override, **When** the next order accrues, **Then** the default rate applies. |
| US-5.8 | As a **customer** (when promotion enabled), I want to share a code so that referred users bind to me | **P1** | **Given** customer promotion is enabled, **When** I obtain my customer promotion code from account or merchant UI, **Then** new registrants using that code bind per architect rules (customer-as-promoter or lightweight distributor). **Given** promotion is disabled, **When** I use a customer code, **Then** registration rejects. |
| US-5.9 | As a **merchant owner**, I want QR bind to remain available alongside invite codes so that existing workflows are not broken | **P1** | **Given** Phase 4 QR generation, **When** I issue a CUSTOMER or MERCHANT QR, **Then** bind behavior is unchanged. **Given** a user already bound via QR, **When** they use an invite code, **Then** one-binding-per-entity rule applies (no duplicate uplines). |

### Epic C — Distributor portal (`apps/distributor`)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-5.10 | As a **distributor**, I want to see my upline chain and the commission rate that applies to me so that I understand my deal | **P0** | **Given** distributor JWT, **When** I open the portal home or "Uplines" section, **Then** I see my direct parent (name, id) and effective commission rate for my sales. **Given** multi-level hierarchy is implemented, **When** I view uplines, **Then** I see the ancestor chain up to root with each level's configured rate affecting my subtree per architect rules. **Given** no parent (root distributor), **When** I view uplines, **Then** I see tenant default rate explanation. |
| US-5.11 | As a **distributor**, I want to see commission totals by status so that I know what I have earned | **P0** | **Given** distributor JWT, **When** I view earnings, **Then** I see totals for at least: accrued (unsettled), settled, and withdrawn (or available for withdrawal). **Given** commission ledger entries exist, **When** I drill into details, **Then** I see read-only line items (order ref, amount, date, status) scoped to my `distributorId`. |
| US-5.12 | As a **distributor**, I want to submit a withdrawal request so that I can get paid offline | **P0** | **Given** available balance ≥ minimum (tenant-configurable, default > 0), **When** I submit amount `A` and optional note, **Then** a withdrawal request is created in PENDING state and available balance is reserved or validated. **Given** `A` exceeds available balance, **When** I submit, **Then** validation fails. **Given** a pending request, **When** I submit another, **Then** behavior is reject or queue per architect (document in architecture). **No payment API is called.** |
| US-5.13 | As a **merchant owner**, I want to review distributor withdrawal requests so that I can approve offline payouts | **P0** | **Given** merchant auth, **When** I open Withdrawal requests, **Then** I see PENDING items with distributor, amount, requested date, note. **Given** a PENDING request, **When** I approve, **Then** status becomes APPROVED/PAID and ledger reflects withdrawal; distributor sees updated balance. **Given** I reject with reason, **When** saved, **Then** status is REJECTED, reserved balance is released, distributor sees reason. |

### Epic D — Factory master data & allocation (`apps/admin`, `apps/merchant`)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-5.14 | As a **platform admin**, I want CRM (contacts, companies, leads) so that I can manage factory B2B relationships | **P0** | **Given** platform admin auth, **When** I use CRM modules, **Then** I can CRUD contacts, companies, and leads scoped to the platform (not tenant data). **Given** merchant tenant CRM data, **When** I search platform CRM, **Then** merchant records never appear (isolation). **Given** pipeline stages, **When** I update a lead, **Then** stage transitions follow NEW → QUALIFIED → WON \| LOST (same semantics as merchant CRM). |
| US-5.15 | As a **platform admin**, I want a master product catalog so that I control cost, pricing, and stock at the factory | **P0** | **Given** platform admin auth, **When** I CRUD master SKUs, **Then** each record includes: name, SKU code (unique platform-wide), on-hand inventory, cumulative shipped quantity, unit cost, wholesale price (下级拿货价), retail price (最终售价), and active flag. **Given** list views, **When** I filter by SKU or name, **Then** results paginate. **Given** invalid numeric input, **When** I save, **Then** validation errors are field-level. |
| US-5.16 | As a **platform admin**, I want to create store allocation orders so that I ship goods to merchant stores | **P0** | **Given** an approved merchant tenant, **When** I create an allocation order with line items (master SKU + quantity), **Then** status starts as DRAFT or ISSUED per workflow. **Given** ISSUED allocation, **When** merchant confirms receipt, **Then** status becomes CONFIRMED and merchant-visible stock updates per architect sync rules. **Given** insufficient factory inventory, **When** I issue, **Then** operation fails with clear error. |
| US-5.17 | As a **merchant owner**, I want to submit allocation requests to the factory so that I can replenish store stock | **P0** | **Given** merchant auth, **When** I create a replenishment request selecting master SKUs and quantities, **Then** status is PENDING. **Given** platform admin reviews, **When** approved, **Then** status is APPROVED and optionally spawns a platform allocation order (US-5.16). **Given** rejected, **When** merchant views request, **Then** rejection reason is visible. |

### Epic E — Store registration context

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-5.18 | As a **registrant**, I want invite codes validated against the selected store so that upline binding is tenant-correct | **P0** | **Given** invite code valid for tenant slug `S`, **When** I register at `/s/S/register?invite=CODE`, **Then** binding succeeds. **Given** the same code, **When** I register at `/s/other/register`, **Then** registration fails before account creation with slug mismatch message. **Given** missing invite on distributor-recruitment flow, **When** architect requires invite for distributor signup, **Then** optional vs required is documented in architecture (default: required for new distributor recruits via link). |

## Release Slices (recommended)

| Slice | Stories | Outcome |
|-------|---------|---------|
| **1** | US-5.1, US-5.2, US-5.5, US-5.6, US-5.18 | Unified store + invite registration bind |
| **2** | US-5.3, US-5.4, US-5.7, US-5.10–US-5.13 | Distributor management, portal earnings & withdrawal |
| **3** | US-5.14–US-5.17 | Admin CRM, master catalog, allocation & merchant requests |
| **4** | US-5.8, US-5.9 | Customer promotion + QR coexistence |

## Non-Goals

- **Real payout rails** — bank transfer, WeChat Pay, Stripe Connect, or automated disbursement
- **Multi-level commission split on a single order** in P0 (record hierarchy + direct rate override only; N-level split is P1/P2 unless architect pulls forward)
- **Replacing tenant `Product` catalog** — master SKUs sync or map via allocation; merchants may still maintain storefront products
- **International multi-currency, tax, invoicing**
- **SMS / push notifications** for invite or withdrawal events (email optional P1)
- **Fraud analytics** beyond rate limiting on invite validation
- **Re-binding or transferring upline** after initial bind
- **Barcode scanning, lot tracking, serial numbers** on factory catalog
- **Distributor editing downline tree** (only merchant promotes / invite creates downlines in P0)

## Success Metrics

| Metric | Target |
|--------|--------|
| Valid invite registration → upline bind success rate | ≥ 98% |
| Store dropdown → first product view (median) | < 3 clicks from `/` |
| Distributor withdrawal request → merchant action within 7 days | ≥ 80% |
| Allocation request → admin decision median | < 3 business days (baseline) |
| Factory allocation CONFIRMED → merchant sellable qty visible | < 5 minutes |
| P0 stories covered by automated tests | 100% mapped (API e2e + Playwright smoke per slice) |

## Dependencies on Architecture

The architect should produce `docs/architecture/phase-5-distribution-and-allocation.md` before implementation. The PRD intentionally avoids prescribing schemas and endpoints.

1. Public store list API for published tenants
2. Invite code entity, validation, revocation, and brute-force protection
3. Distributor hierarchy (`parentDistributorId`) and per-edge commission override
4. P0 commission accrual scope (direct upline only vs multi-level)
5. Platform master SKU model vs tenant `Product` / `ProductVariant` sync on allocation confirm
6. Shipped quantity semantics (global factory counter vs per-store decrement on order PAID)
7. `WithdrawalRequest` state machine and interaction with `CommissionLedger`
8. Customer promotion entity model when Settings enabled
9. Platform CRM data model (shared module vs isolated tables)
10. RBAC: merchant staff permissions for withdrawal approve, allocation request, downline rate edit
11. Shared Zod DTOs in `packages/shared` for all new contracts

## Open Questions

| # | Question | Owner | Notes |
|---|----------|-------|-------|
| 1 | Invite code: new `InviteCode` table vs extend `DistributorQrCode`? | Architect | 6-char codes need different entropy/expiry than JWT QR |
| 2 | Is `parentDistributorId` + `DistributorCommissionOverride` sufficient for P0? | Architect | |
| 3 | P0 commission: credit only direct parent or split up N levels? | Product / Architect | PRD defaults direct parent for P0 |
| 4 | On allocation confirm, auto-clone master SKU to tenant catalog or manual mapping UI? | Architect / Product | |
| 5 | `shippedQuantity`: factory-global only or also per-tenant allocated sub-count? | Architect | |
| 6 | Withdrawal: reserve balance on PENDING vs validate on approve only? | Architect | |
| 7 | Published store list: all APPROVED tenants or flag `storePublished`? | Product | |
| 8 | Customer promoter: same `Distributor` row or separate `Promoter` type? | Architect | Gated by US-5.3 |
| 9 | Platform CRM: reuse CRM module with `@BypassTenant()` or `PlatformCrm*` tables? | Architect | |
| 10 | Can upline distributors set rates on their downlines, or merchant-only in P0? | Product | User mentioned 代理对下级设比例 — clarify portal vs merchant UI |
| 11 | Minimum withdrawal amount and frequency limits? | Product | Default TBD in architecture |
| 12 | Invite code single-use vs multi-use per downline recruit? | Product | Default: multi-use until revoked |

## Related Documents

| Document | Path |
|----------|------|
| Platform overview | `docs/prd/platform-overview.md` |
| Phase 4 distributors | `docs/prd/phase-4-distributor-enhancements.md` |
| Distributor portal | `docs/prd/distributor-portal.md` |
| Phase 2 commission | `docs/prd/phase-2-ecommerce.md` |
| Phase 3 inventory (merchant PO) | `docs/prd/phase-3-inventory.md` |
| Phase 1 architecture | `docs/architecture/phase-1-foundation.md` |
| ERP domain rules | `.cursor/rules/erp-domain.mdc` |
