# P0 Order Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or executing-plans.

**Goal:** Add order cancel/refund flows and auto-expire unpaid orders.

**Architecture:** Central `OrderLifecycleService` handles status transitions, Stripe refunds, and inventory reversal. BullMQ repeatable job expires `PENDING_PAYMENT` orders. Store/Platform/Merchant controllers expose cancel/refund endpoints.

**Tech Stack:** NestJS, Prisma, BullMQ, Stripe mock/real

---

### Task 1: OrderLifecycleService + Payment refund

**Files:**
- Create: `apps/api/src/orders/order-lifecycle.service.ts`
- Create: `apps/api/src/orders/order-lifecycle.module.ts`
- Modify: `apps/api/src/payment/payment.service.ts`
- Modify: `packages/shared/src/queues.ts` (ORDER_QUEUE)

### Task 2: API endpoints (store / platform / merchant)

### Task 3: Expire pending orders job

### Task 4: E2E tests
