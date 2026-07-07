# CRM AI Follow-up — Architecture

**Version:** 1.0.0  
**Updated:** 2026-07-07  
**Contracts:** [`packages/shared/src/crm-ai.ts`](../../packages/shared/src/crm-ai.ts)

## Overview

Merchant CRM detail pages call a tenant-scoped API that loads lead/contact context from Prisma, synthesizes follow-up advice via shared `AiLlmService` (mock rules or Anthropic-compatible live API), and returns `CrmFollowUpSuggestion`.

## API

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/v1/merchant/crm/ai/follow-up` | Merchant JWT + `@RequiresPlugin('crm')` |

**Body:** `{ leadId?: string, contactId?: string }` — exactly one required  
**Response:** `CrmFollowUpSuggestion`

## Module layout

```
apps/api/src/
├── ai/llm/
│   ├── ai-llm.service.ts          # unified mock/live router
│   ├── anthropic-llm.client.ts    # shared completeMessages()
│   └── crm-follow-up-mock.client.ts
└── merchant/crm/ai/
    ├── crm-ai.controller.ts
    ├── crm-follow-up.service.ts
    └── prompts/crm-follow-up-system-prompt.ts
```

## Data flow

1. Validate `leadId` xor `contactId`
2. Load entity + last 10 `CrmActivity` rows (tenant-scoped)
3. Build context JSON (`stage`, `daysSinceLastActivity`, activities)
4. `AiLlmService.suggestCrmFollowUp(context)` → mock or live JSON parse
5. On live failure → fallback mock

## Environment

| Variable | Default | Notes |
|----------|---------|-------|
| `AI_MODE` | `mock` | `live` enables Anthropic API; legacy `AI_DIAGNOSIS_MODE` still honored |
| `AI_ANTHROPIC_BASE_URL` | — | Falls back to diagnosis / `ANTHROPIC_*` vars |
| `AI_ANTHROPIC_API_KEY` | — | Same |
| `AI_ANTHROPIC_MODEL` | `ark-code-latest` | Volcengine Ark Coding Plan |

## Security

- Strict `tenantId` on all Prisma queries
- No PII in server logs (ids only)
- `NODE_ENV=test` forces mock
