# Phase 2 E-commerce — Architecture

## Overview

Extends the Phase 1 monolith with a third auth realm (`store`), e-commerce Prisma models, Stripe checkout, and commission accrual via BullMQ. Consumer storefront: `apps/store` (port 3003).

## Tenant Routing

Store resolves tenant by path: `https://store.example/s/{tenantSlug}/...`

API public catalog: `GET /api/v1/store/:tenantSlug/products`

## Auth Architecture

### Store JWT

```typescript
interface JwtPayload {
  sub: string;        // customerId
  aud: 'store';
  tenantId: string;
  roles: ['CUSTOMER'];
}
```

| Strategy | Guard | Routes |
|----------|-------|--------|
| `CustomerJwtStrategy` | `StoreAuthGuard` | `/api/v1/store/:slug/account/*` |
| Guest session | `GuestCartGuard` | cart via `X-Cart-Session` header or cookie |

Secrets: `JWT_STORE_SECRET` (new env var), cookie prefix `store_`

## Prisma Schema (Phase 2 additions)

```prisma
enum OrderStatus {
  PENDING_PAYMENT
  PAID
  FULFILLED
  CANCELLED
  REFUNDED
}

enum LedgerStatus {
  ACCRUED
  SETTLED
  VOID
}

enum SettlementBatchStatus {
  DRAFT
  EXPORTED
  PAID
}

model Customer { ... }
model Category { ... }
model Product { ... }
model ProductVariant { ... }
model Cart { ... }
model CartItem { ... }
model Order { ... }
model OrderLine { ... }
model CommissionLedger { ... }
model SettlementBatch { ... }
```

See `apps/api/prisma/schema.prisma` for full definitions.

## API Contracts

### Store (public / customer)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/store/:slug/products` | Public | Published product list |
| GET | `/api/v1/store/:slug/products/:productSlug` | Public | Product detail |
| POST | `/api/v1/store/:slug/auth/register` | Public | Customer register |
| POST | `/api/v1/store/:slug/auth/login` | Public | Customer login |
| GET | `/api/v1/store/cart` | Guest/Customer | Get cart |
| POST | `/api/v1/store/cart/items` | Guest/Customer | Add line |
| PATCH | `/api/v1/store/cart/items/:id` | Guest/Customer | Update qty |
| DELETE | `/api/v1/store/cart/items/:id` | Guest/Customer | Remove line |
| POST | `/api/v1/store/checkout` | Guest/Customer | Create order + Stripe intent |
| POST | `/api/v1/store/webhooks/stripe` | Stripe sig | Payment confirmation |

### Merchant catalog

| Method | Path | Description |
|--------|------|-------------|
| CRUD | `/api/v1/merchant/categories` | Category management |
| CRUD | `/api/v1/merchant/products` | Product + variants |
| GET | `/api/v1/merchant/orders` | Tenant order list |
| GET | `/api/v1/merchant/orders/:id` | Order detail |

### Platform admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/platform/orders` | Cross-tenant search |
| GET | `/api/v1/platform/settlements` | Ledger batches |
| POST | `/api/v1/platform/settlements/export` | Create export batch |

## Checkout Flow

```
Customer → add to cart → POST checkout
  → Order PENDING_PAYMENT + Stripe PaymentIntent
  → Stripe webhook payment_intent.succeeded
  → Order PAID, inventory decrement, CommissionLedger ACCRUED (if distributorId)
  → BullMQ job: order.confirmation (email stub)
```

## Commission Calculation

```typescript
// PERCENT: amount = order.total * (rate / 100)
// FIXED: amount = rate per order line or per order (per distributor config — per order in Phase 2)
```

Ledger unique per `orderId`. Settlement batch groups ACCRUED entries by date range for CSV export.

## Module Boundaries

```
apps/api/src/
  store/           # Public store routes (catalog, cart, checkout, auth)
  merchant/catalog/  # Product/category CRUD
  merchant/orders/   # Merchant order views
  platform/orders/   # Admin cross-tenant
  platform/settlements/
  commission/        # Accrual service + processor
  auth/              # + customer-jwt.strategy.ts
```

## Async Jobs

| Queue | Job | Trigger |
|-------|-----|---------|
| `commission` | `order.accrue` | Order PAID |
| `email` | `order.confirmation` | Order PAID |
| `settlement` | `batch.export` | Admin export request |

## ADRs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Store routing | Path `/s/:slug` | No DNS wildcard needed in dev |
| Payments | Stripe Payment Intents | Webhook-driven PAID state |
| Guest carts | Session UUID cookie | Lower friction checkout |
| Inventory | Decrement on PAID | Avoid oversell during payment |
| Settlement | CSV export only | Payout rails deferred |

## Error Shape

Same as Phase 1: `{ statusCode, message, error, details? }`
