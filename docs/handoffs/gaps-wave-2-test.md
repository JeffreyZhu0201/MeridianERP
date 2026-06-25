# Gaps Wave 2 — Store Commerce Test Handoff

## Scope

G-8 customer order history API + account UI; G-9 Stripe Payment Element + confirmation page.

## Files

- `apps/api/src/store/orders/*`
- `apps/store/app/s/[slug]/account/page.tsx`
- `apps/store/app/s/[slug]/orders/[id]/confirmation/*`
- `apps/store/app/s/[slug]/checkout/_components/checkout-payment-step.tsx`
- `apps/store/app/s/[slug]/checkout/_components/stripe-payment-form.tsx`
- `packages/shared/src/ecommerce.ts`
- `apps/api/test/store-orders.e2e-spec.ts`
- `e2e/gaps-store.spec.ts`

## P0 acceptance

| Criterion | Test | Status |
|-----------|------|--------|
| Customer-scoped order list/detail | `store-orders.e2e-spec.ts` | PASS |
| Mock checkout returns `mockPayment: true` | `store-checkout.e2e-spec.ts` | PASS |
| Live Stripe Payment Element wired | Manual + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | PASS |
| Account page shows orders | `gaps-store.spec.ts` | PASS |

## Open questions

- CI remains mock Stripe; live card tests are manual only.

## Next agent

Wave 3 platform settings.
