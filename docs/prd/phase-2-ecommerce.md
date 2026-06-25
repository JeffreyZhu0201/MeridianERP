# Phase 2 E-commerce — Product Requirements

**Status:** API complete · Store UI ~60% · Merchant catalog done · See [platform overview](./platform-overview.md)

## Implementation Status (2025-06-25)

| ID | Story | API | Merchant UI | Store UI | Admin UI | Tests |
|----|-------|-----|-------------|----------|----------|-------|
| US-2.1 | Product catalog CRUD | ✅ | ✅ Products + Categories | ✅ Browse + PDP | — | `store-catalog.e2e-spec.ts` |
| US-2.2 | Customer register/login | ✅ | — | ✅ | — | `store-auth.e2e-spec.ts` |
| US-2.3 | Cart + checkout | ✅ | — | ⚠️ G-5, G-6, G-9 | — | `store-checkout.e2e-spec.ts` |
| US-2.4 | Distributor attribution | ✅ (cart `distributorId`) | — | ❌ G-7 customer bind | — | checkout e2e (API) |
| US-2.5 | Commission on PAID | ✅ | — | N/A | — | `store-checkout.e2e-spec.ts` |
| US-2.6 | Settlement ledger + export | ✅ | — | N/A | ✅ | — |
| US-2.7 | Inventory decrement | ✅ | — (catalog shows qty) | N/A | — | `store-checkout.e2e-spec.ts` |

### Store routes (`apps/store`)

| Route | Status |
|-------|--------|
| `/` | ✅ Landing |
| `/s/[slug]` | ✅ Product grid |
| `/s/[slug]/products/[productSlug]` | ✅ PDP with stock badge |
| `/s/[slug]/cart` | ⚠️ Logged-in only; guest session missing |
| `/s/[slug]/checkout` | ⚠️ Wrong API path; no Stripe UI |
| `/s/[slug]/login`, `/register` | ✅ |
| `/s/[slug]/account` | ❌ Stub — no order history API |
| `/s/[slug]/bind/[token]` | ⚠️ UI exists; API contract mismatch |

### Merchant gaps (Phase 2)

- **G-11:** `GET /merchant/orders` API exists; no merchant orders UI
- Product images: placeholder only
- No order confirmation page in store

### Payment flow

- Backend: `POST /store/:slug/checkout`, Stripe webhook, `simulate-payment` for test env
- Frontend: creates pending order only; Stripe Payment Element not integrated

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

## Follow-up Work (to close Phase 2 UI)

| Priority | Item | Ref |
|----------|------|-----|
| P0 | Fix checkout API path to `/store/${slug}/checkout` | G-5 |
| P0 | Send `X-Cart-Session` for guest carts | G-6 |
| P0 | Customer bind flow (store JWT or dedicated claim endpoint) | G-7 |
| P1 | Stripe Payment Element + order confirmation page | G-9 |
| P1 | Customer order history API + account page | G-8 |
| P1 | Merchant orders list UI | G-11 |
| P2 | Product images, cart drawer, catalog search | design doc |

## Related Documents

| Document | Path |
|----------|------|
| Platform overview | `docs/prd/platform-overview.md` |
| Architecture | `docs/architecture/phase-2-ecommerce.md` |
| Store wireframes | `docs/design/phase-2-store.md` |
