# AI Streaming — Architecture

**Version:** 1.0.0  
**Contracts:** [`packages/shared/src/ai-stream.ts`](../../packages/shared/src/ai-stream.ts), [`packages/shared/src/ai-stream-client.ts`](../../packages/shared/src/ai-stream-client.ts)

## Overview

All seven AI generation features expose a parallel `POST .../stream` endpoint that returns **Server-Sent Events (SSE)** with structured `AiStreamEvent` payloads. Mock and live modes share the same event protocol; sync `POST` endpoints remain for e2e and fallback.

## SSE format

- `Content-Type: text/event-stream; charset=utf-8`
- Each event: `data: ${JSON.stringify(AiStreamEvent)}\n\n`
- Terminal event: `{ type: "done", result, callLogId?, analysisId? }`
- Error event: `{ type: "error", message }`

## Event types by feature

| Feature | Intermediate events |
| ------- | ------------------- |
| `PLATFORM_DIAGNOSIS` | `cards`, `report_delta` |
| `PLATFORM_*_INSIGHT` | `summary_delta`, `finding`, `recommendation`, `risk` |
| `MERCHANT_REPLENISHMENT` | `summary_delta`, `priority`, `recommendation` |
| `MERCHANT_PRODUCT_COPY` | `title_delta`, `description_delta`, `bullet` |
| `MERCHANT_CRM_FOLLOW_UP` | `summary_delta`, `next_step`, `talking_point` |

All streams begin with `{ type: "started", feature, mode }`.

## Endpoints

| Stream path | Sync path |
| ----------- | --------- |
| `POST /platform/ai/diagnosis/stream` | `/diagnosis` |
| `POST /platform/ai/insights/withdrawal/stream` | `.../withdrawal` |
| `POST /platform/ai/insights/delivery-order/stream` | `.../delivery-order` |
| `POST /platform/ai/insights/funds/stream` | `.../funds` |
| `POST /merchant/catalog/ai/product-copy/stream` | `.../product-copy` |
| `POST /merchant/crm/ai/follow-up/stream` | `.../follow-up` |
| `POST /merchant/inventory/ai/replenishment/stream` | `.../replenishment` |

## Procurement prefill (non-stream)

`GET /merchant/inventory/ai/replenishment/procurement-prefill` returns the latest replenishment analysis mapped to HQ `masterSkuId` lines for the procurement cart. Returns `204` when no usable analysis exists.

## Backend modules

```
apps/api/src/ai/
├── streaming/
│   ├── ai-sse.helper.ts          # initSseResponse, pipeAiStream
│   ├── ai-stream-emitters.ts     # chunkText helpers
│   └── ai-stream-result-emitters.ts
└── llm/
    ├── ai-llm-stream.service.ts  # stream* generators
    └── anthropic-llm.client.ts   # streamMessages (live tokens)
```

`AiLlmStreamService` calls the existing sync `AiLlmService`, then emits structured events via result emitters. Replenishment stream persists `AiAnalysisRecord` on `done`.

## Frontend

- Shared client: `streamAiPost` / `consumeAiSseStream` in `@meridian/shared`
- App wrappers: `apps/admin/lib/ai-stream.ts`, `apps/merchant/lib/ai-stream.ts`
- Panels incrementally render partial state until `done`

## Environment

Reuses `AI_MODE`, `AI_ANTHROPIC_*` from [`ai-diagnosis.md`](ai-diagnosis.md).
