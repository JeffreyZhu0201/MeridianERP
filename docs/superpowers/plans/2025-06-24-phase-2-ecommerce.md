# Phase 2 — E-commerce Implementation Plan

> **Prerequisite:** Phase 1 complete (auth, CRM, onboarding, distributor QR binding).

**Goal:** Launch the consumer storefront (`apps/store`), product catalog, cart/checkout, customer accounts, order-driven commission calculation, and settlement ledger.

**Architecture:** Extend monolith NestJS API with `store` auth realm, new Prisma models for catalog/orders/payments, Next.js storefront on port 3003, BullMQ jobs for commission accrual and settlement batches.

**Tech Stack:** Same as Phase 1 + Stripe (or payment provider TBD), Playwright store e2e, optional Elasticsearch for catalog search (P2).

**Reference docs:** `docs/superpowers/specs/2025-06-24-meridianerp-platform-design.md` (Phase 2 section)

---

## Phase 2 PRD Summary

### User Stories (draft)

| ID | Story | Priority |
|----|-------|----------|
| US-2.1 | As a merchant, I want to manage a product catalog so customers can browse my store | P0 |
| US-2.2 | As a customer, I want to register and log in to the store | P0 |
| US-2.3 | As a customer, I want to add products to cart and checkout | P0 |
| US-2.4 | As a customer, I want to scan a distributor QR before purchase so commission is attributed | P0 |
| US-2.5 | As a merchant, I want orders to auto-calculate distributor commission | P0 |
| US-2.6 | As a platform admin, I want a settlement ledger and payout export | P1 |
| US-2.7 | As a merchant, I want inventory counts decremented on order | P1 |

### Non-Goals (Phase 2)

- Multi-currency / multi-region tax
- Subscription billing for SaaS tenants
- Advanced warehouse / PO workflows (Phase 3)
- Native mobile apps

---

## Task 1: Phase 2 PRD & Architecture

**Files:**
- Create: `docs/prd/phase-2-ecommerce.md`
- Create: `docs/architecture/phase-2-ecommerce.md`
- Create: `docs/design/phase-2-store.md`

**Deliverables:**
- Customer JWT realm (`aud: 'store'`)
- Prisma models: `Product`, `ProductVariant`, `Category`, `Cart`, `CartItem`, `Order`, `OrderLine`, `Customer`, `CommissionLedger`, `SettlementBatch`
- API contracts for catalog, cart, checkout, orders
- ADR: payment provider, commission calculation timing (on paid vs fulfilled)

---

## Task 2: Prisma Schema Extension

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: migration `phase2_ecommerce`

**Models (sketch):**

```prisma
model Customer {
  id        String   @id @default(cuid())
  tenantId  String
  email     String
  password  String
  @@unique([tenantId, email])
}

model Product {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  slug        String
  description String?
  variants    ProductVariant[]
  @@unique([tenantId, slug])
}

model Order {
  id              String   @id @default(cuid())
  tenantId        String
  customerId      String
  distributorId   String?  // from bind session or QR
  status          OrderStatus
  total           Decimal
  lines           OrderLine[]
  commissionEntry CommissionLedger?
}
```

---

## Task 3: Store Auth Module ✅

**Files:**
- `apps/api/src/auth/strategies/customer-jwt.strategy.ts`
- `apps/api/src/auth/guards/store-auth.guard.ts`
- `apps/api/src/store/auth/store-auth.controller.ts`
- `apps/api/src/store/auth/store-auth.service.ts`
- Test: `apps/api/test/store-auth.e2e-spec.ts`

**Endpoints:**
- `POST /api/v1/store/:slug/auth/register`
- `POST /api/v1/store/:slug/auth/login`
- JWT: `aud: store`, secret `JWT_STORE_SECRET`, roles `['CUSTOMER']`

---

## Task 4: Catalog API (TDD) ✅

**Files:**
- `apps/api/src/store/catalog/`
- `apps/api/src/merchant/catalog/`
- Test: `apps/api/test/store-catalog.e2e-spec.ts`

---

## Task 5: Cart & Checkout (TDD) ✅

**Files:**
- `apps/api/src/store/cart/`, `checkout/`
- `apps/api/src/payment/`
- Test: `apps/api/test/store-checkout.e2e-spec.ts`

---

## Task 6: Commission Engine ✅

**Files:**
- `apps/api/src/commission/commission.service.ts`
- `apps/api/src/queue/commission-queue.service.ts`

---

## Task 7: packages/ui — Store Shell ✅

**Files:**
- `packages/ui/src/components/shells/store-shell.tsx`
- `packages/ui/src/components/product-card.tsx`
- `packages/ui/src/components/cart-drawer.tsx`

---

## Task 8: apps/store (Next.js, port 3003) ✅

**Pages:** `/s/[slug]/` — products, cart, checkout, auth, bind

---

## Task 9: Merchant Catalog UI ✅

**Routes:** `/catalog/products`, `/catalog/categories`

---

## Task 10: Admin Settlement UI ✅

**Routes:** `/settlements`, `/orders`

---

## Task 11: Docker & CI ✅

- `apps/store/Dockerfile` + `docker/docker-compose.yml` store service
- `.github/workflows/ci.yml`

---

## Task 12: E2E Smoke Tests ✅

**File:** `e2e/phase-2-store.spec.ts`

---

## Success Metrics (Phase 2)

| Metric | Target |
|--------|--------|
| Checkout completion (test env) | > 90% |
| Commission accuracy | 100% match manual calc on sample orders |
| Store Lighthouse performance | > 80 performance score |
| API p95 checkout | < 500ms |

---

## Execution Order

1. PRD + architecture docs (Task 1)
2. Schema + migrations (Task 2)
3. Store auth (Task 3)
4. Catalog API + merchant catalog UI (Tasks 4, 9) — parallel
5. Cart/checkout + commission (Tasks 5, 6)
6. Store frontend (Tasks 7, 8)
7. Admin settlements (Task 10)
8. Docker/CI + e2e (Tasks 11, 12)

---

## Open Decisions (resolve in Task 1)

| Decision | Options | Resolution |
|----------|---------|------------|
| Tenant routing | Subdomain vs path prefix | **Path `/s/:slug`** — see `docs/architecture/phase-2-ecommerce.md` |
| Payment | Stripe vs manual | **Stripe test mode** |
| Commission trigger | On PAID vs SHIPPED | **On PAID** |
| Guest checkout | Yes/No | **Yes** with email capture |

### Task 1 status: ✅ Complete

- [x] `docs/prd/phase-2-ecommerce.md`
- [x] `docs/architecture/phase-2-ecommerce.md`
- [x] `docs/design/phase-2-store.md`

### Task 2 status: ✅ Complete

- [x] Prisma schema extended (`Customer`, `Product`, `Order`, `CommissionLedger`, …)
- [x] Migration `20250624180000_phase2_ecommerce`
- [x] Shared enums in `packages/shared`

### Task 3 status: ✅ Complete

- [x] `CustomerJwtStrategy` + `StoreAuthGuard`
- [x] `POST /api/v1/store/:slug/auth/register|login`
- [x] Tenant slug resolution (approved merchants only)
- [x] E2e: `apps/api/test/store-auth.e2e-spec.ts` (6 tests)

### Tasks 4–12 status: ✅ Complete

- [x] Catalog API (store public + merchant CRUD) — 25 API e2e tests total
- [x] Cart, checkout, mock Stripe, commission on PAID
- [x] `apps/store` (port 3003), merchant catalog UI, admin orders/settlements
- [x] Docker store service, GitHub Actions CI, `e2e/phase-2-store.spec.ts`
- [x] Demo seed: `/s/demo` store with sample product

**Phase 2: COMPLETE**

---

Plan saved. Execute via agent pipeline per `docs/execution/README.md`.
