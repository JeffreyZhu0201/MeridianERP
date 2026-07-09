# AI Operations Diagnosis

**Version:** 1.0  
**Status:** Shipped (mock + live Anthropic-compatible)  
**Canonical contracts:** [`packages/shared/src/ai.ts`](../../packages/shared/src/ai.ts)

## Overview

Platform operators run natural-language diagnostics from Admin (`/diagnosis`). The API orchestrates domain tools against live Prisma data and synthesizes a structured report. **Default mode is mock** — no external LLM API keys required.

## API

| Method | Path                            | Auth                                             |
| ------ | ------------------------------- | ------------------------------------------------ |
| `POST` | `/api/v1/platform/ai/diagnosis` | `PlatformAuthGuard` + `SUPER_ADMIN` or `FINANCE` |

**Request body:** `{ "query": string }`  
**Response:** `DiagnosisResult` from `@meridian/shared`

## Module boundaries

```
apps/api/src/ai/
├── ai.module.ts
├── diagnosis/
│   ├── diagnosis.controller.ts
│   ├── diagnosis.service.ts
│   └── tools/          # Prisma-backed domain queries
└── llm/
    ├── anthropic-llm.client.ts  # Live: Anthropic-compatible API (Volcengine Ark, etc.)
    ├── llm.service.ts           # mock/live router with fallback
    └── mock-llm.client.ts       # Deterministic report synthesis
```

`DiagnosisService` parses the query (order id, tenant slug, domain keywords), runs applicable tools in parallel, then delegates to `LlmService` (mock or live Anthropic-compatible client).

## Tools

| Tool               | Inputs                                        | Data                                               |
| ------------------ | --------------------------------------------- | -------------------------------------------------- |
| `order_query`      | `orderId?`, `tenantId?`                       | Order status, fulfillment, totals                  |
| `commission_query` | `orderId?`, `tenantId?`, `allocationOrderId?` | Allocation-ledgers; explains ALLOCATION-only rules |
| `inventory_query`  | `tenantId?`, `skuCode?`                       | Stock levels, MasterSku on-hand                    |
| `fund_query`       | `tenantId?`                                   | Branch net position snapshot                       |

## Commission semantics (prompt + tools)

- Promoter commission accrues on **allocation order `CONFIRMED`**, max **2 per recruited branch**.
- **No retail order commission**; order-level `commissionLedger` on `PAID`/`FULFILLED` orders is not expected.

## Environment

| Variable                | Default           | Purpose                                                          |
| ----------------------- | ----------------- | ---------------------------------------------------------------- |
| `AI_MODE`               | `mock`            | Global `mock` / `live`; legacy `AI_DIAGNOSIS_MODE` still honored |
| `AI_ANTHROPIC_BASE_URL` | —                 | Also `AI_DIAGNOSIS_ANTHROPIC_BASE_URL` / `ANTHROPIC_BASE_URL`    |
| `AI_ANTHROPIC_API_KEY`  | —                 | Also diagnosis / `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_API_KEY`    |
| `AI_ANTHROPIC_MODEL`    | `ark-code-latest` | Also `AI_DIAGNOSIS_ANTHROPIC_MODEL` / `ANTHROPIC_MODEL`          |
| `AI_DIAGNOSIS_MODE`     | `mock`            | Legacy per-feature flag; use `AI_MODE` for new features          |

When `AI_DIAGNOSIS_MODE=live` and base URL + API key are set, `AnthropicLlmClient` calls `{baseURL}/v1/messages` (Anthropic Messages API). On failure, the service falls back to mock synthesis.

## Call logging

Every AI invocation (diagnosis, admin insights, merchant replenishment/product copy/CRM) writes an `AiCallLog` row with:

- `feature`, `mode` (`LIVE` | `MOCK` | `LIVE_FALLBACK_MOCK`), `status`, `latencyMs`
- Optional `tenantId`, `actorUserId`, truncated `inputSummary` / `outputSummary`

Platform admins list logs at `GET /api/v1/platform/ai/calls` (`SUPER_ADMIN`, `FINANCE`) and check runtime mode at `GET /api/v1/platform/ai/status`.

Merchant replenishment analyses are also stored in `AiAnalysisRecord` for `/merchant/inventory/ai/replenishment/latest` and `/history`.

## Security

- Platform JWT only; roles `SUPER_ADMIN`, `FINANCE`.
- Queries are logged server-side (`query`, `userId`, timestamp).
- Tools return tenant-scoped data; no cross-tenant leakage in error messages.

## ADR

**Mock-first LLM:** Default mode needs no external API. Set `AI_DIAGNOSIS_MODE=live` with Anthropic-compatible base URL (e.g. Volcengine Ark Coding Plan) for natural-language reports; tool contracts unchanged.
