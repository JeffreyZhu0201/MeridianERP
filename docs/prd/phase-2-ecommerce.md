# Phase 2 E-commerce — Product Requirements

## Problem

Merchants approved in Phase 1 need a consumer-facing storefront to sell products, while the platform must attribute orders to distributors and accrue commission for later settlement.

## Users

| Persona | Goals |
|---------|-------|
| End Customer | Browse catalog, purchase, manage account |
| Merchant Owner | Manage products, categories, inventory, view orders |
| Merchant Staff | Assist with catalog and order support |
| Distributor Agent | Earn commission on referred customer purchases |
| Platform Super Admin | Oversee orders, export settlement batches |

## User Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-2.1 | As a merchant, I want to manage a product catalog so customers can browse my store | P0 | Given merchant auth, When I CRUD products/categories, Then data is tenant-scoped and slug-unique per tenant. |
| US-2.2 | As a customer, I want to register and log in to the store | P0 | Given tenant slug, When I register with email/password, Then I receive store JWT (`aud: store`) scoped to tenant. |
| US-2.3 | As a customer, I want to add products to cart and checkout | P0 | Given published products, When I add to cart and checkout, Then Order is created PENDING_PAYMENT; on Stripe test payment success, status becomes PAID. |
| US-2.4 | As a customer, I want distributor attribution before purchase | P0 | Given valid CUSTOMER bind token or session cookie, When I checkout, Then order.distributorId is set from binding. |
| US-2.5 | As a merchant, I want orders to auto-calculate distributor commission | P0 | Given PAID order with distributorId, When payment completes, Then CommissionLedger entry is ACCRUED using distributor rate/type. |
| US-2.6 | As a platform admin, I want a settlement ledger and payout export | P1 | Given ACCRUED entries in period, When I export batch, Then CSV includes orderId, distributor, amount, tenant. |
| US-2.7 | As a merchant, I want inventory decremented on order | P1 | Given variant inventory N, When order PAID with quantity Q, Then inventory becomes N−Q (not below 0). |

## Non-Goals

- Multi-currency / multi-region tax
- Subscription billing for SaaS tenants
- Advanced warehouse / purchase orders (Phase 3)
- Native mobile apps
- Real payout rails (export only in Phase 2)

## Decisions (locked)

| # | Question | Decision |
|---|----------|----------|
| 1 | Tenant routing | Path prefix `/s/:slug` on `apps/store` |
| 2 | Payment provider | Stripe test mode |
| 3 | Commission trigger | On order PAID |
| 4 | Guest checkout | Yes — email captured at checkout; optional account create |

## Success Metrics

| Metric | Target |
|--------|--------|
| Checkout completion (test env) | > 90% |
| Commission accuracy | 100% match manual calc on sample orders |
| Store Lighthouse performance | > 80 |
| API p95 checkout | < 500ms |

## Dependencies

- Phase 1 complete: tenant slugs, distributor bindings, merchant auth
- Stripe test keys in `.env`
- `apps/store` on port 3003
