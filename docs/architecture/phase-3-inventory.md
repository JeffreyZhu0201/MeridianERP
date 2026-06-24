# Phase 3 Inventory — Architecture

## Overview

Phase 3 replaces the flat `ProductVariant.inventory` counter with warehouse-scoped stock (`StockLevel`), auditable manual adjustments, purchase-order receiving, and low-stock alerts — while preserving Phase 2 storefront checkout behavior via a **cached sellable aggregate** on `ProductVariant.inventory`.

**Key decisions (see ADRs):**

- Sellable qty for storefront/catalog = on-hand at the tenant **default warehouse** (MVP); field `ProductVariant.inventory` stays as a denormalized cache synced on every stock movement.
- All stock mutations flow through a single `InventoryService` (transactional, hard-blocks negative on-hand).
- Purchase orders use an event-based receive model (`PurchaseOrderReceipt`) supporting multiple partial receives per line.
- Merchant RBAC: `MERCHANT_OWNER` and `MERCHANT_STAFF` may adjust stock and create/receive POs; warehouse CRUD and tenant inventory settings are owner-only.
- Platform admin gets read-only cross-tenant inventory summary with audit logging.

**Dependencies:** Phase 1 (tenant isolation, merchant JWT), Phase 2 (`ProductVariant`, checkout decrement on `PAID`).

## Data Model

### New Prisma enums

```prisma
enum PurchaseOrderStatus {
  DRAFT
  ORDERED
  PARTIALLY_RECEIVED
  RECEIVED
  CANCELLED
}

enum StockAdjustmentReason {
  DAMAGE
  COUNT_CORRECTION
  RETURN
  OTHER
}
```

Shared copies: `@meridian/shared` → `PurchaseOrderStatus`, `StockAdjustmentReason`.

### Prisma models

```prisma
model TenantInventorySettings {
  tenantId                String @id
  tenant                  Tenant @relation(fields: [tenantId], references: [id])
  defaultReorderThreshold Int    @default(5)
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}

model Warehouse {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  name      String
  address   String?
  isDefault Boolean  @default(false)
  isActive  Boolean  @default(true)
  stockLevels      StockLevel[]
  adjustments      StockAdjustment[]
  purchaseOrders   PurchaseOrder[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, isDefault])
}

model StockLevel {
  id             String         @id @default(cuid())
  tenantId       String
  tenant         Tenant         @relation(fields: [tenantId], references: [id])
  warehouseId    String
  warehouse      Warehouse      @relation(fields: [warehouseId], references: [id])
  variantId      String
  variant        ProductVariant @relation(fields: [variantId], references: [id])
  quantityOnHand Int            @default(0)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@unique([warehouseId, variantId])
  @@index([tenantId])
  @@index([tenantId, warehouseId])
  @@index([tenantId, variantId])
}

model StockAdjustment {
  id             String                @id @default(cuid())
  tenantId       String
  tenant         Tenant                @relation(fields: [tenantId], references: [id])
  warehouseId    String
  warehouse      Warehouse             @relation(fields: [warehouseId], references: [id])
  variantId      String
  variant        ProductVariant        @relation(fields: [variantId], references: [id])
  actorId        String
  actor          User                  @relation(fields: [actorId], references: [id])
  reason         StockAdjustmentReason
  note           String?
  quantityDelta  Int                   // signed: +increase, -decrease
  quantityBefore Int
  quantityAfter  Int
  createdAt      DateTime              @default(now())

  @@index([tenantId, createdAt])
  @@index([tenantId, warehouseId])
  @@index([tenantId, variantId])
}

model PurchaseOrder {
  id            String              @id @default(cuid())
  tenantId      String
  tenant        Tenant              @relation(fields: [tenantId], references: [id])
  warehouseId   String
  warehouse     Warehouse           @relation(fields: [warehouseId], references: [id])
  supplierName  String
  status        PurchaseOrderStatus @default(DRAFT)
  poNumber      String              // tenant-scoped display number, e.g. PO-00042
  createdById   String
  createdBy     User                @relation("PurchaseOrderCreatedBy", fields: [createdById], references: [id])
  orderedAt     DateTime?
  lines         PurchaseOrderLine[]
  receipts      PurchaseOrderReceipt[]
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@unique([tenantId, poNumber])
  @@index([tenantId, status])
  @@index([tenantId, warehouseId])
}

model PurchaseOrderLine {
  id                String        @id @default(cuid())
  purchaseOrderId   String
  purchaseOrder     PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  variantId         String
  variant           ProductVariant @relation(fields: [variantId], references: [id])
  quantityOrdered   Int
  quantityReceived  Int           @default(0) // cached sum of receipt lines
  receiptLines      PurchaseOrderReceiptLine[]
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@unique([purchaseOrderId, variantId])
  @@index([purchaseOrderId])
}

model PurchaseOrderReceipt {
  id              String                     @id @default(cuid())
  tenantId        String
  tenant          Tenant                     @relation(fields: [tenantId], references: [id])
  purchaseOrderId String
  purchaseOrder   PurchaseOrder              @relation(fields: [purchaseOrderId], references: [id])
  receivedById    String
  receivedBy      User                       @relation("PurchaseOrderReceivedBy", fields: [receivedById], references: [id])
  note            String?
  lines           PurchaseOrderReceiptLine[]
  createdAt       DateTime                   @default(now())

  @@index([tenantId, purchaseOrderId])
  @@index([purchaseOrderId, createdAt])
}

model PurchaseOrderReceiptLine {
  id                  String               @id @default(cuid())
  receiptId           String
  receipt             PurchaseOrderReceipt @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  purchaseOrderLineId String
  purchaseOrderLine   PurchaseOrderLine    @relation(fields: [purchaseOrderLineId], references: [id])
  quantityReceived    Int

  @@index([receiptId])
  @@index([purchaseOrderLineId])
}
```

### Phase 2 model changes

```prisma
model ProductVariant {
  // ... existing fields ...
  inventory         Int        @default(0)  // cached sellable qty (default warehouse on-hand in MVP)
  reorderThreshold  Int?       // null → tenant defaultReorderThreshold
  stockLevels       StockLevel[]
  adjustments       StockAdjustment[]
  purchaseOrderLines PurchaseOrderLine[]
}

model Tenant {
  // ... existing relations ...
  inventorySettings TenantInventorySettings?
  warehouses        Warehouse[]
  stockLevels       StockLevel[]
  adjustments       StockAdjustment[]
  purchaseOrders    PurchaseOrder[]
  purchaseOrderReceipts PurchaseOrderReceipt[]
}

model User {
  // ... existing fields ...
  stockAdjustments       StockAdjustment[]
  purchaseOrdersCreated  PurchaseOrder[]        @relation("PurchaseOrderCreatedBy")
  purchaseOrdersReceived PurchaseOrderReceipt[] @relation("PurchaseOrderReceivedBy")
}
```

### Entity relationships

```
Tenant 1──1 TenantInventorySettings
Tenant 1──* Warehouse (exactly one isDefault=true per tenant)
Warehouse *──* ProductVariant  via StockLevel (qty per pair)
PurchaseOrder *──1 Warehouse (receive target)
PurchaseOrder 1──* PurchaseOrderLine *──1 ProductVariant
PurchaseOrder 1──* PurchaseOrderReceipt 1──* PurchaseOrderReceiptLine → PurchaseOrderLine
StockAdjustment → Warehouse + ProductVariant + User (actor)
ProductVariant.inventory ← synced from default Warehouse StockLevel (MVP)
```

## Migration Strategy

Migration name: `phase3_inventory`.

### Step 1 — Schema

Add enums, new tables, `ProductVariant.reorderThreshold`, `TenantInventorySettings`, and relations. Do **not** drop `ProductVariant.inventory`.

### Step 2 — Backfill (SQL or Prisma seed script in migration)

For each `Tenant`:

1. Insert `TenantInventorySettings` with `defaultReorderThreshold = 5`.
2. Insert one `Warehouse` (`name = 'Default Warehouse'`, `isDefault = true`, `isActive = true`).
3. For each `ProductVariant` belonging to the tenant (via `Product`):
   - Insert `StockLevel` with `quantityOnHand = ProductVariant.inventory` at the default warehouse.
   - Leave `ProductVariant.inventory` unchanged (already matches).

Tenants with zero variants still get default warehouse + settings for forward compatibility.

### Step 3 — Application cutover

- Deploy `InventoryService` before enabling merchant inventory UI.
- Replace direct `productVariant.update({ inventory: { decrement } })` in checkout with `InventoryService.decrementForOrder(orderId)` (see Checkout Integration).
- Catalog read paths continue to expose `variant.inventory` (no API break for storefront).
- Merchant catalog write: stop accepting manual `inventory` on variant create/update (read-only derived field); stock changes go through adjustments/PO receive.

### Rollback risk

- **Low** if migration only adds tables; rollback = revert app, keep warehouse rows orphaned.
- **Data drift** if movements write only `StockLevel` without syncing cache — mitigated by central `InventoryService`.

### Verification query (post-migration)

```sql
SELECT pv.id, pv.inventory, sl."quantityOnHand"
FROM "ProductVariant" pv
JOIN "Product" p ON p.id = pv."productId"
JOIN "StockLevel" sl ON sl."variantId" = pv.id
JOIN "Warehouse" w ON w.id = sl."warehouseId" AND w."isDefault" = true
WHERE pv.inventory <> sl."quantityOnHand";
-- expect 0 rows
```

## InventoryService (core domain)

Single write path for all quantity changes:

```typescript
// apps/api/src/inventory/inventory.service.ts

interface StockMutationResult {
  stockLevelId: string;
  quantityBefore: number;
  quantityAfter: number;
  sellableInventory: number; // updated ProductVariant.inventory
}

// All methods run in Prisma $transaction with row-level lock on StockLevel (SELECT FOR UPDATE via update where)

applyAdjustment(input: CreateAdjustmentInput): Promise<StockAdjustment>
receivePurchaseOrder(input: ReceivePurchaseOrderInput): Promise<PurchaseOrderReceipt>
decrementForOrder(orderId: string): Promise<void>  // idempotent per order
syncSellableCache(variantId: string, tenantId: string): Promise<number>
```

**Sellable cache sync (MVP):**

```typescript
// sellable = StockLevel.quantityOnHand WHERE warehouse.isDefault = true
// await tx.productVariant.update({ where: { id }, data: { inventory: sellable } })
```

**Negative stock:** reject with `400 Bad Request` if `quantityAfter < 0` on any mutation (adjustments, receive validation is inbound-only, order decrement).

**Default warehouse resolution:** `Warehouse` where `tenantId` and `isDefault = true`; throw `409` if missing (should not happen post-migration).

## Purchase Order State Machine

```
                    submit (optional at create)
         ┌──────────────────────────────────────┐
         ▼                                      │
      DRAFT ──────────────────────────────► ORDERED
         │                                      │
         │ cancel (0 received)                  │ cancel (0 received)
         ▼                                      ▼
     CANCELLED ◄────────────────────────── CANCELLED
                                              │
                              partial receive │
                                              ▼
                                    PARTIALLY_RECEIVED
                                              │
                              all lines fully │
                              received        ▼
                                         RECEIVED
```

| Transition | Guard | Side effects |
|------------|-------|--------------|
| DRAFT → ORDERED | ≥1 line; valid variants/warehouse | Set `orderedAt` |
| ORDERED → PARTIALLY_RECEIVED | Any line `0 < received < ordered` | — |
| PARTIALLY_RECEIVED → RECEIVED | All lines `received = ordered` | — |
| ORDERED → RECEIVED | Single receive completes all lines | — |
| DRAFT/ORDERED → CANCELLED | `sum(quantityReceived) = 0` | No stock change |
| Receive while CANCELLED/RECEIVED | — | `400` |

`quantityReceived` on `PurchaseOrderLine` is updated atomically with each receipt; status derived after receipt in same transaction.

## Checkout Integration (Phase 2 update)

### Pre-payment validation (`POST /api/v1/store/:slug/checkout`)

Replace `item.variant.inventory` check with sellable qty from cache (kept in sync):

```typescript
// Equivalent: default warehouse StockLevel.quantityOnHand
if (item.variant.inventory < item.quantity) {
  throw new BadRequestException(`Insufficient inventory for ${item.variant.name}`);
}
```

Store catalog responses continue to return `variant.inventory` as availability (US-3.8, US-3.14).

### On `PAID` (`markOrderPaid`)

```typescript
await inventoryService.decrementForOrder(orderId);
// For each order line with variantId:
//   1. Resolve tenant default warehouse
//   2. Decrement StockLevel.quantityOnHand by line.quantity (hard block if insufficient)
//   3. Sync ProductVariant.inventory
//   4. Enqueue inventory.low-stock-check job (stub)
```

**Idempotency:** retain existing guard `order.status === PENDING_PAYMENT` before transition; `decrementForOrder` is only called once per successful payment. No double-decrement on webhook replay.

**Commission / email:** unchanged; inventory decrement stays in the same transaction boundary as order status update (extend current `$transaction`).

**Refunds (out of scope):** `REFUNDED` does not restock in MVP; document for Phase 3.1.

## Low-stock evaluation

```typescript
effectiveThreshold(variant) =
  variant.reorderThreshold ?? tenant.inventorySettings.defaultReorderThreshold

isLowStock(variant, defaultWarehouseQty) =
  defaultWarehouseQty <= effectiveThreshold(variant)
```

- List endpoint computes from live `StockLevel` + thresholds (not cache-only).
- Optional Redis cache for list UI; invalidated on any `InventoryService` mutation for tenant.

## API Contracts

Base: `/api/v1`. Error shape unchanged: `{ statusCode, message, error, details? }`.

Types: `@meridian/shared` → `packages/shared/src/inventory.ts`.

### Merchant — `/api/v1/merchant/inventory/*`

Auth: `MerchantAuthGuard`. Tenant from JWT.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/settings` | OWNER, STAFF | Tenant inventory settings |
| PATCH | `/settings` | OWNER | Update `defaultReorderThreshold` |
| GET | `/warehouses` | OWNER, STAFF | List warehouses |
| POST | `/warehouses` | OWNER | Create warehouse |
| GET | `/warehouses/:id` | OWNER, STAFF | Warehouse detail |
| PATCH | `/warehouses/:id` | OWNER | Update name, address, isActive |
| POST | `/warehouses/:id/set-default` | OWNER | Set sole default warehouse |
| GET | `/stock-levels` | OWNER, STAFF | Query: `warehouseId?`, `variantId?`, `q?` (sku/name), `page`, `limit` |
| GET | `/stock-levels/summary` | OWNER, STAFF | Aggregated by variant across warehouses |
| POST | `/adjustments` | OWNER, STAFF | Create manual adjustment |
| GET | `/adjustments` | OWNER, STAFF | Filter: `from`, `to`, `reason`, `warehouseId`, `variantId`, `page` |
| GET | `/alerts/low-stock` | OWNER, STAFF | Variants at/below threshold at default warehouse |
| PATCH | `/variants/:variantId/reorder-threshold` | OWNER | Set/clear per-variant threshold |
| GET | `/purchase-orders` | OWNER, STAFF | Filter: `status`, `warehouseId`, `page` |
| POST | `/purchase-orders` | OWNER, STAFF | Create PO (`status`: `DRAFT` or `ORDERED`) |
| GET | `/purchase-orders/:id` | OWNER, STAFF | PO detail + lines + receipts |
| PATCH | `/purchase-orders/:id` | OWNER, STAFF | Edit header/lines while `DRAFT` only |
| POST | `/purchase-orders/:id/submit` | OWNER, STAFF | `DRAFT` → `ORDERED` |
| POST | `/purchase-orders/:id/cancel` | OWNER, STAFF | Cancel if zero received |
| POST | `/purchase-orders/:id/receive` | OWNER, STAFF | Partial/full receive |
| GET | `/reports/stock` | OWNER, STAFF | Current stock snapshot |
| GET | `/reports/adjustments` | OWNER, STAFF | Adjustment history report |
| GET | `/reports/export/stock` | OWNER, STAFF | CSV download |
| GET | `/reports/export/adjustments` | OWNER, STAFF | CSV download |

#### Request/response shapes (selected)

**POST `/adjustments`**

```typescript
// CreateStockAdjustmentRequest
{
  warehouseId: string;
  variantId: string;
  quantityDelta: number;  // non-zero integer; negative = decrease
  reason: StockAdjustmentReason;
  note?: string;          // recommended when reason = OTHER
}
// → StockAdjustmentResponse (includes actor summary, before/after)
```

**POST `/purchase-orders`**

```typescript
{
  warehouseId: string;
  supplierName: string;
  status: 'DRAFT' | 'ORDERED';  // ORDERED sets orderedAt immediately
  lines: { variantId: string; quantityOrdered: number }[];
}
// → PurchaseOrderResponse
```

**POST `/purchase-orders/:id/receive`**

```typescript
{
  note?: string;
  lines: { purchaseOrderLineId: string; quantityReceived: number }[];
}
// Validates: quantityReceived <= remaining per line; PO status in ORDERED | PARTIALLY_RECEIVED
// → PurchaseOrderReceiptResponse + updated PO status
```

**GET `/alerts/low-stock`**

```typescript
// → { items: LowStockAlertItem[] }
// LowStockAlertItem: variantId, sku, name, productName, quantityOnHand, reorderThreshold, warehouseId
```

### Platform — `/api/v1/platform/inventory/*`

Auth: `PlatformAuthGuard`. `@BypassTenant()` with audit log entry.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/tenants/:tenantId/summary` | SUPER_ADMIN, PLATFORM_OPS | Warehouses, total SKUs, units on hand, low-stock count |
| GET | `/tenants/:tenantId/adjustments` | SUPER_ADMIN, PLATFORM_OPS | Recent adjustments (`limit`, `from`, `to`) |
| GET | `/tenants/:tenantId/purchase-orders` | SUPER_ADMIN, PLATFORM_OPS | Recent POs (`status?`, `limit`) — support visibility |

No POST/PATCH/DELETE on platform inventory routes in MVP.

### Store (unchanged paths, behavior update)

| Method | Path | Change |
|--------|------|--------|
| GET | `/api/v1/store/:slug/products` | `variant.inventory` = synced sellable qty |
| POST | `/api/v1/store/:slug/checkout` | Validates against synced cache; decrement via `InventoryService` on PAID |

### Merchant catalog (minor)

| Method | Path | Change |
|--------|------|--------|
| POST/PATCH | `/api/v1/merchant/products` | Ignore/remove `inventory` on variant writes; display read-only in responses |

## Module Boundaries

```
apps/api/src/
  inventory/
    inventory.module.ts
    inventory.service.ts          # stock mutations, cache sync, low-stock helper
    inventory.constants.ts
  merchant/inventory/
    merchant-inventory.module.ts
    warehouses.controller.ts
    stock-levels.controller.ts
    adjustments.controller.ts
    purchase-orders.controller.ts
    reports.controller.ts
    settings.controller.ts
  platform/inventory/
    platform-inventory.module.ts
    platform-inventory.controller.ts
  store/checkout/
    store-checkout.service.ts     # call InventoryService on PAID
  merchant/catalog/
    products.service.ts           # stop writing variant.inventory

apps/merchant/src/
  app/(shell)/inventory/
    warehouses/
    stock/
    adjustments/
    purchase-orders/
    reports/
    settings/

apps/admin/src/
  app/(shell)/tenants/[id]/inventory/   # read-only platform summary
```

## Async Jobs

| Queue | Job | Payload | Trigger | Retry |
|-------|-----|---------|---------|-------|
| `inventory` | `low-stock-check` | `{ tenantId, variantId?, warehouseId? }` | After any stock mutation | 3 attempts, exponential backoff |

**MVP stub:** processor logs payload and no-ops (future: email/in-app notifications). Enqueue after adjustment, receive, and order decrement.

Existing queues (`commission`, `email`, `settlement`) unchanged.

## Caching

| Key | TTL | Content | Invalidation |
|-----|-----|---------|--------------|
| `inventory:low-stock:{tenantId}` | 60s | `LowStockAlertItem[]` | Delete on any `InventoryService` mutation for tenant |
| `inventory:settings:{tenantId}` | 300s | `TenantInventorySettings` | Delete on PATCH settings |

Stock levels and adjustments are read from PostgreSQL (indexed queries); no cache required for MVP p95 target.

## ADRs

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| ADR-3.1 | `ProductVariant.inventory` | **Keep as cached sellable aggregate** synced on every movement | Storefront/catalog already consume this field; avoids JOIN on hot checkout path; warehouse sums remain source of truth via `StockLevel` |
| ADR-3.2 | Storefront fulfillment | **Default warehouse only** | Matches PRD MVP; multi-warehouse allocation deferred |
| ADR-3.3 | PO lifecycle | **DRAFT → ORDERED → PARTIALLY_RECEIVED → RECEIVED**; **CANCELLED** from DRAFT/ORDERED if zero received | Clear inbound pipeline; partial receives via receipt events |
| ADR-3.4 | Adjustment reasons | **Enum** `DAMAGE`, `COUNT_CORRECTION`, `RETURN`, `OTHER` **+ optional note** | Structured reporting with human context |
| ADR-3.5 | Inventory RBAC | **MERCHANT_OWNER** and **MERCHANT_STAFF** adjust/receive POs; **OWNER-only** for warehouses, settings, reorder defaults | Staff operational access; owner retains structural config |
| ADR-3.6 | Negative stock | **Hard block** on adjustments, receives (implicit), checkout, and order decrement | Prevents silent oversell; backorder flag deferred |
| ADR-3.7 | Partial PO receive | **`PurchaseOrderReceipt` + lines**; multiple events per PO line | Full audit trail; matches US-3.6 |
| ADR-3.8 | Platform admin scope | **Read-only** summary + recent adjustments/POs; audit logged | Support visibility without cross-tenant writes |
| ADR-3.9 | Default reorder threshold | **Tenant-level default 5** when `ProductVariant.reorderThreshold` null | PRD US-3.9 |
| ADR-3.10 | Order payment idempotency | **Single decrement** when `PENDING_PAYMENT → PAID` only | Prevents double-decrement on webhook replay (PRD #10) |

## Open Questions (resolved)

All PRD open questions closed by ADRs above. No blockers for UI/implementation.

## Related Documents

| Document | Path |
|----------|------|
| PRD | `docs/prd/phase-3-inventory.md` |
| Phase 2 architecture | `docs/architecture/phase-2-ecommerce.md` |
| Shared types | `packages/shared/src/inventory.ts`, `packages/shared/src/enums.ts` |
