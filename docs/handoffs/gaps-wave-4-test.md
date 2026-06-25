# Gaps Wave 4 — Email Queue Test Handoff

## Scope

BullMQ email processor; business triggers (welcome, reject, binding, commission, order); merchant dashboard `recentActivity`.

## Files

- `apps/api/src/queue/queue.module.ts`
- `apps/api/src/queue/email.processor.ts`
- `apps/api/src/queue/email-queue.service.ts`
- `apps/api/src/queue/console-mail.transport.ts`
- `packages/shared/src/queues.ts`
- Call sites: `platform-merchants`, `bindings`, `commission`, `store-checkout`
- `apps/api/src/merchant/dashboard/merchant-dashboard.service.ts`
- `apps/api/test/email-queue.e2e-spec.ts`

## P0 acceptance

| Criterion | Test | Status |
|-----------|------|--------|
| Order confirmation enqueued on PAID | `email-queue.e2e-spec.ts` | PASS |
| Binding created email enqueued | `email-queue.e2e-spec.ts` | PASS |
| Merchant welcome/reject enqueued | `email-queue.e2e-spec.ts` | PASS |
| Dashboard activity feed | `gaps-wave1.e2e-spec.ts` | PASS |

## Open questions

- Production `EMAIL_PROVIDER` (Resend/SMTP) not implemented; dev uses console transport.

## Next agent

Wave 5 stock transfers.
