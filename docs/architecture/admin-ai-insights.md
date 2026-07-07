# Admin AI Insights — Architecture

**Version:** 1.0.0  
**Contracts:** [`packages/shared/src/admin-ai.ts`](../../packages/shared/src/admin-ai.ts)

## API

| Method | Path | Roles |
|--------|------|-------|
| `POST` | `/api/v1/platform/ai/insights/withdrawal` | SUPER_ADMIN, FINANCE, REVIEWER |
| `POST` | `/api/v1/platform/ai/insights/delivery-order` | SUPER_ADMIN, FULFILLMENT |
| `POST` | `/api/v1/platform/ai/insights/funds` | SUPER_ADMIN, FINANCE |

## Module

```
apps/api/src/ai/
├── insights/
│   ├── platform-ai-insights.controller.ts
│   ├── withdrawal-insight.service.ts
│   ├── delivery-order-insight.service.ts
│   ├── funds-insight.service.ts
│   └── prompts/admin-insight-system-prompt.ts
└── llm/
    ├── admin-insight-mock.client.ts
    └── admin-insight.types.ts
```

`AiModule` imports `PlatformFundsModule` for funds context. Withdrawal uses `PlatformWithdrawalsService.getAvailableBalance`.

## Flow

Context assembly (Prisma / PlatformFundsService) → `AiLlmService.suggestAdminInsight(scene, context)` → mock or live JSON → `AdminAiInsight`.
