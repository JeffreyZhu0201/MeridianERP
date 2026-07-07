# Merchant AI Efficiency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship merchant-side AI for inventory replenishment suggestions (read-only) and product copy assistant (one-click form fill) reusing `AiLlmService` mock/live pattern.

**Architecture:** Shared contracts in `@meridian/shared`; two merchant endpoints assemble Prisma context then call `AiLlmService.suggestReplenishment` / `suggestProductCopy`; frontend panels mirror CRM AI panel UX.

**Tech Stack:** NestJS, Prisma, Next.js App Router, `@meridian/ui`, `@meridian/shared`, existing Anthropic-compatible LLM client

**Spec:** [`docs/superpowers/specs/2026-07-07-merchant-ai-efficiency-design.md`](../specs/2026-07-07-merchant-ai-efficiency-design.md)

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `packages/shared/src/merchant-ai.ts` | DTOs |
| Modify | `packages/shared/src/index.ts` | export |
| Create | `apps/api/src/ai/llm/merchant-ai.types.ts` | internal context types |
| Create | `apps/api/src/ai/llm/replenishment-mock.client.ts` | mock replenishment |
| Create | `apps/api/src/ai/llm/product-copy-mock.client.ts` | mock copy |
| Modify | `apps/api/src/ai/llm/ai-llm.service.ts` | two new methods + live prompts |
| Modify | `apps/api/src/ai/ai.module.ts` | register mock clients |
| Create | `apps/api/src/merchant/inventory/ai/*` | replenishment API |
| Create | `apps/api/src/merchant/catalog/ai/*` | product copy API |
| Modify | `apps/api/src/merchant/inventory/merchant-inventory.module.ts` | register inventory AI |
| Modify | `apps/api/src/merchant/merchant.module.ts` | register catalog AI |
| Create | `apps/merchant/app/inventory/alerts/_components/inventory-ai-replenishment-panel.tsx` | alerts UI |
| Modify | `apps/merchant/app/inventory/alerts/page.tsx` | embed panel |
| Create | `apps/merchant/app/catalog/products/_components/product-copy-ai-panel.tsx` | sheet UI |
| Modify | `apps/merchant/app/catalog/products/_components/products-table.tsx` | embed panel |
| Modify | `packages/shared/src/i18n/messages/zh-CN/merchant.ts` | i18n |
| Modify | `packages/shared/src/i18n/messages/en/merchant.ts` | i18n |
| Create | `docs/prd/merchant-ai-efficiency.md` | PRD |
| Create | `docs/architecture/merchant-ai-efficiency.md` | architecture |
| Create | `docs/design/merchant-ai-efficiency.md` | design |
| Modify | `docs/PRODUCT.md` | status |
| Create | `apps/api/test/merchant-inventory-ai-replenishment.e2e-spec.ts` | e2e |
| Create | `apps/api/test/merchant-catalog-ai-product-copy.e2e-spec.ts` | e2e |

---

### Task 1: Shared contracts

**Files:**
- Create: `packages/shared/src/merchant-ai.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Add merchant-ai.ts**

```typescript
export type ReplenishmentUrgency = 'critical' | 'high' | 'medium';

export interface ReplenishmentPriorityItem {
  variantId: string;
  sku: string;
  urgency: ReplenishmentUrgency;
  suggestedQty: number;
  rationale: string;
}

export interface ReplenishmentSuggestion {
  summary: string;
  priorities: ReplenishmentPriorityItem[];
  recommendations: string[];
  sources: { type: string; ref: string }[];
}

export interface ProductCopyDraft {
  name?: string;
  description?: string;
  categoryId?: string;
  sku?: string;
  price?: number;
}

export interface ProductCopyRequest {
  productId?: string;
  draft?: ProductCopyDraft;
}

export interface ProductCopySuggestion {
  title: string;
  description: string;
  bulletPoints?: string[];
  tone?: string;
  sources: { type: string; ref: string }[];
}
```

- [ ] **Step 2: Export from index.ts**

Add `export * from './merchant-ai.js';` after `admin-ai.js`.

- [ ] **Step 3: Typecheck**

Run: `rtk pnpm typecheck`  
Expected: PASS

---

### Task 2: Mock clients + AiLlmService

**Files:**
- Create: `apps/api/src/ai/llm/merchant-ai.types.ts`
- Create: `apps/api/src/ai/llm/replenishment-mock.client.ts`
- Create: `apps/api/src/ai/llm/product-copy-mock.client.ts`
- Create: `apps/api/src/merchant/inventory/ai/prompts/replenishment-system-prompt.ts`
- Create: `apps/api/src/merchant/catalog/ai/prompts/product-copy-system-prompt.ts`
- Modify: `apps/api/src/ai/llm/ai-llm.service.ts`
- Modify: `apps/api/src/ai/ai.module.ts`

- [ ] **Step 1: merchant-ai.types.ts**

Define `ReplenishmentContext` and `ProductCopyContext` matching spec §5 (alerts, isFlagship, product/draft fields).

- [ ] **Step 2: ReplenishmentMockClient**

Implement urgency/suggestedQty rules from spec §6.2. Sort priorities: critical first, then by `quantityOnHand` asc. Include `sources` with alert count.

- [ ] **Step 3: ProductCopyMockClient**

If `context.product?.name` or `context.draft?.name` exists, generate title as `「{name}」— 品质之选` style and 2-paragraph description referencing category/price when present. Set `sources`.

- [ ] **Step 4: System prompts**

Copy structure from `crm-follow-up-system-prompt.ts` — Chinese JSON-only output, field descriptions from spec §6.3.

- [ ] **Step 5: Extend AiLlmService**

Add constructor injections for both mock clients. Add:

```typescript
async suggestReplenishment(context: ReplenishmentContext): Promise<ReplenishmentSuggestion>
async suggestProductCopy(context: ProductCopyContext): Promise<ProductCopySuggestion>
```

Live paths: `completeMessages` with system prompt + `JSON.stringify(context)` user message; parse JSON; validate required fields; on failure log + fallback mock (same pattern as `suggestCrmFollowUp`).

- [ ] **Step 6: Register in AiModule**

Add `ReplenishmentMockClient`, `ProductCopyMockClient` to providers.

- [ ] **Step 7: Typecheck**

Run: `rtk pnpm typecheck --filter api`  
Expected: PASS

---

### Task 3: Replenishment API

**Files:**
- Create: `apps/api/src/merchant/inventory/ai/replenishment-ai.service.ts`
- Create: `apps/api/src/merchant/inventory/ai/inventory-ai.controller.ts`
- Modify: `apps/api/src/merchant/inventory/merchant-inventory.module.ts`

- [ ] **Step 1: ReplenishmentAiService**

Inject `MerchantStockService`, `PrismaService`, `AiLlmService`.

`async suggest(tenantId: string): Promise<ReplenishmentSuggestion>`:

1. Load `merchantProfile` for `isFlagship`, `businessName`
2. Load `tenantInventorySettings.defaultReorderThreshold`
3. Call `this.stock.lowStockAlerts(tenantId)` → take up to 20 items sorted by `quantityOnHand`
4. Optional: query last 30 days `stockAdjustment` where `delta < 0`, group by variantId
5. If branch: pending `branchPurchaseOrder` lines with status not fully received
6. Build `ReplenishmentContext` → `aiLlm.suggestReplenishment`

- [ ] **Step 2: InventoryAiController**

```typescript
@Controller('merchant/inventory/ai')
@UseGuards(MerchantAuthGuard)
export class InventoryAiController {
  @Post('replenishment')
  @HttpCode(201)
  replenishment(@CurrentUser() user: AuthenticatedUser) {
    return this.replenishmentAiService.suggest(user.tenantId!);
  }
}
```

- [ ] **Step 3: Wire MerchantInventoryModule**

Import `AiModule`. Add controller + `ReplenishmentAiService` to module.

- [ ] **Step 4: Typecheck**

Run: `rtk pnpm typecheck --filter api`  
Expected: PASS

---

### Task 4: Product copy API

**Files:**
- Create: `apps/api/src/merchant/catalog/ai/product-copy-ai.service.ts`
- Create: `apps/api/src/merchant/catalog/ai/catalog-ai.controller.ts`
- Modify: `apps/api/src/merchant/merchant.module.ts`

- [ ] **Step 1: ProductCopyAiService**

`async suggest(tenantId: string, body: ProductCopyRequest)`:

- If `body.productId`: `MerchantProductsService.findOne` → build context with category name, first variant, `masterSku.retailPrice`, `isBranchLinked = !!masterSkuId`
- Else if `body.draft`: resolve category name if `categoryId`; require `name` or `sku` else `BadRequestException`
- Else: `BadRequestException('productId or draft required')`
- Call `aiLlm.suggestProductCopy`

- [ ] **Step 2: CatalogAiController**

```typescript
@Controller('merchant/catalog/ai')
@UseGuards(MerchantAuthGuard)
export class CatalogAiController {
  @Post('product-copy')
  @HttpCode(201)
  productCopy(@CurrentUser() user, @Body() body: ProductCopyRequest) {
    return this.productCopyAiService.suggest(user.tenantId!, body);
  }
}
```

- [ ] **Step 3: Register in MerchantModule**

Add `CatalogAiController`, `ProductCopyAiService` to controllers/providers.

- [ ] **Step 4: Typecheck**

Run: `rtk pnpm typecheck --filter api`  
Expected: PASS

---

### Task 5: E2E tests (API)

**Files:**
- Create: `apps/api/test/merchant-inventory-ai-replenishment.e2e-spec.ts`
- Create: `apps/api/test/merchant-catalog-ai-product-copy.e2e-spec.ts`

- [ ] **Step 1: Replenishment e2e**

Pattern from `merchant-crm-ai-follow-up.e2e-spec.ts`:

1. Seed merchant + default warehouse + product variant with stock level at/below threshold
2. `POST /api/v1/merchant/inventory/ai/replenishment` → 201, `priorities.length >= 1`, `summary` string
3. Second case: no low stock → 201, `priorities` empty array

- [ ] **Step 2: Product copy e2e**

1. Seed merchant + product with name/description/category
2. `POST /api/v1/merchant/catalog/ai/product-copy` `{ productId }` → 201, `title`, `description`, `sources`
3. `POST` with `{ draft: { name: 'Test Widget' } }` → 201
4. Other tenant productId → 404
5. `{ draft: {} }` → 400

- [ ] **Step 3: Run tests**

Run: `rtk pnpm test:e2e -- merchant-inventory-ai-replenishment merchant-catalog-ai-product-copy`  
Expected: PASS

---

### Task 6: Merchant frontend — inventory panel

**Files:**
- Create: `apps/merchant/app/inventory/alerts/_components/inventory-ai-replenishment-panel.tsx`
- Modify: `apps/merchant/app/inventory/alerts/page.tsx`
- Modify: `packages/shared/src/i18n/messages/zh-CN/merchant.ts`
- Modify: `packages/shared/src/i18n/messages/en/merchant.ts`

- [ ] **Step 1: i18n keys**

Under `merchant.inventory.ai`: `title`, `readonly`, `generate`, `generating`, `submitFailed`, `summary`, `priorities`, `recommendations`, `emptyHint`, urgency labels, `reorderLink`.

- [ ] **Step 2: InventoryAiReplenishmentPanel**

Mirror `crm-ai-follow-up-panel.tsx`:

- POST `/merchant/inventory/ai/replenishment`
- Render summary, priority list with urgency Badge, recommendations
- Each priority: optional Link to `/inventory/procurement`

- [ ] **Step 3: Embed in alerts page**

Pass `token` from server page; render panel above `LowStockAlertsTable`.

- [ ] **Step 4: Typecheck**

Run: `rtk pnpm typecheck --filter merchant`  
Expected: PASS

---

### Task 7: Merchant frontend — product copy panel

**Files:**
- Create: `apps/merchant/app/catalog/products/_components/product-copy-ai-panel.tsx`
- Modify: `apps/merchant/app/catalog/products/_components/products-table.tsx`

- [ ] **Step 1: i18n keys**

Under `merchant.catalog.ai`: `title`, `manualSave`, `generate`, `generating`, `submitFailed`, `adoptTitle`, `adoptDescription`, `bulletPoints`, `adoptTitleDone`, `adoptDescriptionDone`.

- [ ] **Step 2: ProductCopyAiPanel**

Props:

```typescript
{
  token: string;
  productId?: string;
  draft: { name: string; description: string; categoryId: string; sku: string; price: string };
  onAdoptTitle: (title: string) => void;
  onAdoptDescription: (description: string) => void;
}
```

POST body: `{ productId, draft: { name, description, categoryId, sku, price: Number(price) || undefined } }`.

Buttons「采纳标题」「采纳描述」call callbacks. Badge「采纳后需手动保存」.

- [ ] **Step 3: Embed in ProductsTable Sheet**

Place panel after description field block. Wire callbacks to `setForm`.

- [ ] **Step 4: Typecheck**

Run: `rtk pnpm typecheck`  
Expected: PASS

---

### Task 8: Phase-gate docs + PRODUCT.md

**Files:**
- Create: `docs/prd/merchant-ai-efficiency.md`
- Create: `docs/architecture/merchant-ai-efficiency.md`
- Create: `docs/design/merchant-ai-efficiency.md`
- Modify: `docs/PRODUCT.md`

- [ ] **Step 1: PRD**

User stories US-MAI1 (replenishment read-only), US-MAI2 (product copy adopt), US-MAI3 (tenant isolation). Out of scope from spec §11.

- [ ] **Step 2: Architecture**

API table, module tree, flow diagram (mermaid), env vars (`AI_MODE` reuse).

- [ ] **Step 3: Design**

UI wireframes from spec §7; component props; i18n key list.

- [ ] **Step 4: PRODUCT.md**

Add merchant AI efficiency bullet under AI features section.

---

### Task 9: Final verification

- [ ] **Step 1: Full typecheck**

Run: `rtk pnpm typecheck`  
Expected: PASS

- [ ] **Step 2: Regression e2e**

Run: `rtk pnpm test:e2e -- merchant-inventory-ai merchant-catalog-ai merchant-crm-ai platform-admin-ai platform-ai-diagnosis`  
Expected: PASS

- [ ] **Step 3: Manual smoke (optional)**

1. Merchant `/inventory/alerts` → 生成建议
2. Merchant `/catalog/products` → edit Sheet → 生成文案 → 采纳 → 保存

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| ReplenishmentSuggestion contract | Task 1 |
| ProductCopySuggestion + adopt UX | Task 1, 7 |
| Two POST endpoints | Task 3, 4 |
| Mock/live AiLlmService | Task 2 |
| Tenant isolation | Task 4, 5 |
| Alerts page panel | Task 6 |
| Product Sheet panel | Task 7 |
| i18n | Task 6, 7 |
| Docs + PRODUCT | Task 8 |
| e2e | Task 5, 9 |
