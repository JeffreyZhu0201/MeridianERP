# AI Operations Diagnosis

**Version:** 1.0  
**Status:** Shipped (mock mode)  
**Canonical contracts:** [`packages/shared/src/ai.ts`](../../packages/shared/src/ai.ts)

## Overview

Platform operators run natural-language diagnostics from Admin (`/diagnosis`). The API orchestrates domain tools against live Prisma data and synthesizes a structured report. **Default mode is mock** — no external LLM API keys required.

## API

| Method | Path | Auth |
|--------|------|------|
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
    └── mock-llm.client.ts   # Deterministic report synthesis
```

`DiagnosisService` parses the query (order id, tenant slug, domain keywords), runs applicable tools in parallel, then delegates to `MockLlmClient`.

## Tools

| Tool | Inputs | Data |
|------|--------|------|
| `order_query` | `orderId?`, `tenantId?` | Order status, fulfillment, totals |
| `commission_query` | `orderId?`, `tenantId?`, `allocationOrderId?` | Allocation-ledgers; explains ALLOCATION-only rules |
| `inventory_query` | `tenantId?`, `skuCode?` | Stock levels, MasterSku on-hand |
| `fund_query` | `tenantId?` | Branch net position snapshot |

## Commission semantics (prompt + tools)

- Promoter commission accrues on **allocation order `CONFIRMED`**, max **2 per recruited branch**.
- **No retail order commission**; order-level `commissionLedger` on `PAID`/`FULFILLED` orders is not expected.

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `AI_DIAGNOSIS_MODE` | `mock` | `mock` = deterministic client; `live` reserved for future OpenAI/Anthropic |

## Security

- Platform JWT only; roles `SUPER_ADMIN`, `FINANCE`.
- Queries are logged server-side (`query`, `userId`, timestamp).
- Tools return tenant-scoped data; no cross-tenant leakage in error messages.

## ADR

**Mock-first LLM:** Ship operator value without external dependencies. Replace `MockLlmClient` with a live provider when `AI_DIAGNOSIS_MODE=live` without changing tool contracts.
