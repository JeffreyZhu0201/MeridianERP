# Merchant AI Efficiency — Architecture

**Version:** 1.0.0  
**Contracts:** [`packages/shared/src/merchant-ai.ts`](../../packages/shared/src/merchant-ai.ts)

## API

| Method | Path                                                  | Guard             |
| ------ | ----------------------------------------------------- | ----------------- |
| `POST` | `/api/v1/merchant/inventory/ai/replenishment`         | MerchantAuthGuard |
| `POST` | `/api/v1/merchant/inventory/ai/replenishment/stream`    | MerchantAuthGuard |
| `GET`  | `/api/v1/merchant/inventory/ai/replenishment/latest`  | MerchantAuthGuard |
| `GET`  | `/api/v1/merchant/inventory/ai/replenishment/history` | MerchantAuthGuard |
| `GET`  | `/api/v1/merchant/inventory/ai/replenishment/procurement-prefill` | MerchantAuthGuard |
| `POST` | `/api/v1/merchant/catalog/ai/product-copy`            | MerchantAuthGuard |
| `POST` | `/api/v1/merchant/catalog/ai/product-copy/stream`     | MerchantAuthGuard |

## Module

```
apps/api/src/merchant/
├── inventory/ai/
│   ├── inventory-ai.controller.ts
│   ├── replenishment-ai.service.ts
│   └── prompts/replenishment-system-prompt.ts
└── catalog/ai/
    ├── catalog-ai.controller.ts
    ├── product-copy-ai.service.ts
    └── prompts/product-copy-system-prompt.ts

apps/api/src/ai/llm/
├── replenishment-mock.client.ts
├── product-copy-mock.client.ts
├── merchant-ai.types.ts
└── ai-llm.service.ts (+ suggestReplenishment / suggestProductCopy)
```

`MerchantInventoryModule` imports `AiModule` for replenishment. Catalog AI registers on `MerchantModule`.

## Flow

`ReplenishmentAiService` reuses `MerchantStockService.lowStockAlerts()` plus optional outbound adjustments and pending procurement → `AiLlmService.suggestReplenishment`.

`ProductCopyAiService` loads product by id or validates draft → `AiLlmService.suggestProductCopy`.

Mock/live via `AI_MODE`; live JSON parse failure falls back to mock. Each replenishment call persists `AiAnalysisRecord` and an `AiCallLog` entry; the alerts page auto-loads the latest analysis on mount.

Frontend panels use SSE stream endpoints for incremental rendering. The procurement shop page can prefill the cart from the latest analysis via `procurement-prefill` (see [`ai-streaming.md`](ai-streaming.md)).

## Environment

Reuses `AI_MODE`, `AI_ANTHROPIC_*` from [`docs/architecture/ai-diagnosis.md`](ai-diagnosis.md).
