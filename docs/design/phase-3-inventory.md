# Phase 3 — Inventory Design

**Apps:** `apps/merchant` (primary), `apps/admin` (read-only support)  
**Shells:** `MerchantShell`, `AdminShell`  
**PRD:** `docs/prd/phase-3-inventory.md`  
**Architecture:** `docs/architecture/phase-3-inventory.md`  
**Design system:** `docs/design/design-system.md`

## Figma

- **File:** [MeridianERP Merchant Inventory](https://www.figma.com/design/LJUdvPOlGByhN4QFdR5wxF/MeridianERP-Merchant-Inventory)
- **Sync:** `generate_figma_design` from `http://localhost:3002/inventory/warehouses` (需已登录商户端)
- **MVP deliverable:** Markdown wireframes below remain reference; Figma frames updated on UI polish passes.

| Frame | Node ID | React route |
|-------|---------|-------------|
| Warehouses list | [1:2](https://www.figma.com/design/LJUdvPOlGByhN4QFdR5wxF?node-id=1-2) | `/inventory/warehouses` |
| Stock levels | [5:2](https://www.figma.com/design/LJUdvPOlGByhN4QFdR5wxF?node-id=5-2) | `/inventory/stock` |
| Adjustments | TBD | `/inventory/adjustments` |
| Low-stock alerts | [10:2](https://www.figma.com/design/LJUdvPOlGByhN4QFdR5wxF?node-id=10-2) | `/inventory/alerts` |
| Purchase orders list | TBD | `/inventory/purchase-orders` |
| Purchase order detail | TBD | `/inventory/purchase-orders/[id]` |
| Receive goods dialog | TBD | `/inventory/purchase-orders/[id]` (modal) |
| Inventory reports | TBD | `/inventory/reports` |
| Inventory settings | TBD | `/inventory/settings` |
| Catalog variant (sellable qty) | TBD | `/catalog/products` (Sheet) |
| Admin tenant inventory | TBD | `/inventory/tenants/[tenantId]` |

---

## Navigation

### Merchant portal — Inventory section

Add collapsible **Inventory** group to `MerchantShell` (between Catalog and Distributors), mirroring CRM/Catalog pattern.

| Nav item | Route | Icon | Roles |
|----------|-------|------|-------|
| Warehouses | `/inventory/warehouses` | `IconBuildingWarehouse` | OWNER, STAFF (read); OWNER (write) |
| Stock levels | `/inventory/stock` | `IconPackages` | OWNER, STAFF |
| Adjustments | `/inventory/adjustments` | `IconAdjustments` | OWNER, STAFF |
| Alerts | `/inventory/alerts` | `IconAlertTriangle` | OWNER, STAFF |
| Purchase orders | `/inventory/purchase-orders` | `IconClipboardList` | OWNER, STAFF |
| Reports | `/inventory/reports` | `IconChartBar` | OWNER, STAFF |
| Settings | `/inventory/settings` | `IconSettings` | OWNER only |

**Low-stock badge (optional P1):** Show count on Alerts nav child when `items.length > 0` — small `Badge` variant `destructive` or `warning` on the Alerts link.

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] {businessName}                          [User ▼]     │
├──────────┬──────────────────────────────────────────────────┤
│ Dashboard│                                                  │
│ CRM      │  Page content (p-6)                              │
│ Catalog  │                                                  │
│ Inventory│  ├ Warehouses                                    │
│   Warehouses│ ├ Stock levels                                │
│   Stock  │  ├ Adjustments                                   │
│   Adjust │  ├ Alerts (3)                                    │
│   Alerts │  ├ Purchase orders                               │
│   POs    │  ├ Reports                                       │
│   Reports│  └ Settings                                      │
│ Distributors│                                               │
│ Settings │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Admin portal — Platform support

No top-level Inventory nav item in MVP. Entry points:

1. **Primary route:** `/inventory/tenants/[tenantId]` — read-only inventory summary for support.
2. **Deep link:** "View inventory" action on `/merchants/[id]` merchant detail (links to route above using tenant ID).

---

## Shared tokens and patterns

| Pattern | Spec |
|---------|------|
| Page title | `text-2xl font-semibold tracking-tight` |
| Page header row | Title left; primary actions right (`flex justify-between items-center`) |
| Filter bar | `flex flex-wrap gap-3` — `Select`, `Input`, date `Popover` + calendar |
| Data tables | shadcn `Table` + `@tanstack/react-table`; sticky header; `Skeleton` rows on load |
| Empty states | Muted icon (`size-6`), message `text-sm text-muted-foreground`, primary CTA |
| Numeric columns | `font-mono text-sm tabular-nums`; right-align qty columns |
| IDs / PO numbers | `font-mono text-xs text-muted-foreground` |
| Toasts | `Sonner` on create/update/receive/cancel success or API error |
| Pagination | Bottom bar, 20 rows default; `meta.total` from API |
| Owner-only actions | Hide button for STAFF; or disabled with `Tooltip` "Owner only" |

### Purchase order status badges

| Status | Badge variant | Color token |
|--------|---------------|-------------|
| `DRAFT` | `secondary` | muted |
| `ORDERED` | `outline` | info (`text-primary`) |
| `PARTIALLY_RECEIVED` | custom warning | `amber-600` / `bg-amber-50` |
| `RECEIVED` | custom success | `emerald-600` / `bg-emerald-50` |
| `CANCELLED` | `destructive` or `secondary` + strikethrough row | muted/destructive |

### Stock adjustment reason labels

Display enum as human-readable badge (`outline`): Damage, Count correction, Return, Other.

### Low-stock severity

| Condition | UI |
|-----------|-----|
| `quantityOnHand === 0` | Row highlight `bg-destructive/5`; Badge "Out of stock" `destructive` |
| `0 < quantityOnHand ≤ threshold` | Badge "Low stock" warning (`amber-600`) |
| Above threshold | No alert badge on stock table; omitted from alerts list |

---

## Merchant screens

### 1. Warehouses (`/inventory/warehouses`)

**User stories:** US-3.1  
**API:** `GET/POST /merchant/inventory/warehouses`, `PATCH /warehouses/:id`, `POST /warehouses/:id/set-default`

#### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│ Warehouses                              [+ Add warehouse]    │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Name          │ Address        │ Default │ Active │ ⋮   │ │
│ ├───────────────┼────────────────┼─────────┼────────┼─────┤ │
│ │ Default WH    │ —              │ ★ Default│ Active │ ⋮  │ │
│ │ East Store    │ 123 Main St…   │ —       │ Active │ ⋮   │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

#### Elements

| Element | Spec |
|---------|------|
| Header | "Warehouses" + "Add warehouse" primary button (OWNER only) |
| Table columns | name, address (truncated), default (Badge "Default" if `isDefault`), status (Badge Active/Inactive), actions |
| Row actions | `DropdownMenu`: Edit, Set as default (if not default), Deactivate (OWNER) |
| Default indicator | `Badge` variant `outline` with `IconStar` — exactly one per tenant |
| Empty | "No warehouses yet" — should not appear post-migration; show default warehouse |

#### Create / Edit dialog

`Dialog` (not Sheet — structural config, not quick CRM edit).

| Field | Control | Validation |
|-------|---------|------------|
| Name | `Input` | Required, max 100 |
| Address | `Textarea` | Optional |
| Active | `Switch` | Edit only; warn if deactivating default |

**Set default:** Separate confirm `Dialog` — "Set {name} as the default fulfillment warehouse?" — calls `POST .../set-default`.

**RBAC:** STAFF sees table read-only; no Add/Edit/Set default.

---

### 2. Stock levels (`/inventory/stock`)

**User stories:** US-3.2, US-3.9 (threshold column)  
**API:** `GET /merchant/inventory/stock-levels`, `GET .../summary`, `PATCH /variants/:variantId/reorder-threshold` (OWNER)

#### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│ Stock levels                                                 │
├──────────────────────────────────────────────────────────────┤
│ Warehouse [All ▼]   Search SKU or product [________]         │
├──────────────────────────────────────────────────────────────┤
│ Product      │ Variant/SKU   │ Warehouse │ On hand │ Reorder│
│ Widget Pro   │ SKU-001       │ Default   │    42   │ 5  [✎]│
│ Widget Pro   │ SKU-001       │ East      │    10   │ 5  [✎]│
│ …            │               │           │         │        │
├──────────────────────────────────────────────────────────────┤
│ Showing 1–20 of 84                              [< 1 2 3 >]  │
└──────────────────────────────────────────────────────────────┘
```

#### Elements

| Element | Spec |
|---------|------|
| Filters | `Select` warehouse (All + list); `Input` search `q` (debounced 300ms) |
| Table columns | productName, variantName + `font-mono` sku, warehouseName, quantityOnHand, reorderThreshold (effective value shown), low-stock Badge if applicable |
| Reorder threshold edit | OWNER: inline `Button` ghost icon `IconPencil` opens small `Dialog` — number `Input` (≥0) or "Use tenant default" checkbox (clears override) |
| Row click | Optional: none in MVP (adjustments on separate page) |
| Summary mode toggle (P1) | `Tabs`: "By warehouse" (default) / "By variant" — uses `stock-levels/summary` aggregated view |

**Sellable qty note:** Footer caption `text-xs text-muted-foreground`: "Storefront sellable quantity uses on-hand at the **default warehouse** only."

---

### 3. Adjustments (`/inventory/adjustments`)

**User stories:** US-3.3  
**API:** `POST /merchant/inventory/adjustments`, `GET /merchant/inventory/adjustments`

#### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│ Stock adjustments                                            │
├──────────────────────────────────────────────────────────────┤
│ ┌─ Record adjustment ──────────────────────────────────────┐ │
│ │ Warehouse [Default ▼]  Product variant [Search combobox ▼]│ │
│ │ Adjustment type (○ Increase  ○ Decrease)  Qty [___]       │ │
│ │ Reason [Damage ▼]   Note [optional textarea]            │ │
│ │                              [Record adjustment]         │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ History                                                      │
│ From [date] To [date]  Warehouse [All]  Reason [All]       │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Date │ Product │ WH │ Δ │ Before→After │ Reason │ Actor  ││
│ └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

#### Adjustment form (top `Card`)

| Field | Control | Notes |
|-------|---------|-------|
| Warehouse | `Select` | Default pre-selected to tenant default |
| Variant | `Combobox` | Search by SKU/name; shows sku + product name |
| Direction | `RadioGroup` | Increase / Decrease — UI sends signed `quantityDelta` |
| Quantity | `Input` type number | Min 1; positive integer |
| Reason | `Select` | DAMAGE, COUNT_CORRECTION, RETURN, OTHER |
| Note | `Textarea` | Recommended when OTHER; optional otherwise |

**Submit:** Primary button "Record adjustment". On `400` (negative stock), inline `Alert` destructive with API message.

#### History table (below form)

| Column | Format |
|--------|--------|
| createdAt | Relative + tooltip absolute |
| product / variant | Name + mono sku |
| warehouse | Name |
| quantityDelta | `+N` emerald / `-N` destructive, mono |
| before → after | `12 → 15` mono |
| reason | Badge |
| actor | email or name `text-xs` |

**Filters:** Date range (`Popover` calendar), warehouse `Select`, reason `Select`. Pagination 20/page.

---

### 4. Low-stock alerts (`/inventory/alerts`)

**User stories:** US-3.4, US-3.9  
**API:** `GET /merchant/inventory/alerts/low-stock`

#### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│ Low-stock alerts                          [Inventory settings]│
├──────────────────────────────────────────────────────────────┤
│ 3 variants at or below reorder threshold (default warehouse)│
├──────────────────────────────────────────────────────────────┤
│ Status │ Product / SKU      │ On hand │ Threshold │ Actions │
│ Out    │ Widget / SKU-001   │    0    │     5     │ [Adj][PO]│
│ Low    │ Gadget / SKU-002   │    3    │     5     │ [Adj][PO]│
└──────────────────────────────────────────────────────────────┘
```

#### Elements

| Element | Spec |
|---------|------|
| Subtitle | Count of alert items; updates after mutations |
| Table columns | status Badge, productName + sku, quantityOnHand (mono), reorderThreshold (mono), actions |
| Row actions | "Adjust stock" → `/inventory/adjustments` with query prefill (`?variantId=&warehouseId=`); "Create PO" → `/inventory/purchase-orders/new?variantId=` |
| Empty | Success tone: `IconCircleCheck` + "All variants are above reorder thresholds" |
| Link | "Inventory settings" ghost button → `/inventory/settings` (OWNER) |

---

### 5. Purchase orders

#### 5a. List (`/inventory/purchase-orders`)

**User stories:** US-3.5, US-3.10  
**API:** `GET /merchant/inventory/purchase-orders`

```
┌──────────────────────────────────────────────────────────────┐
│ Purchase orders                        [+ Create PO]         │
├──────────────────────────────────────────────────────────────┤
│ Status [All ▼]   Warehouse [All ▼]                           │
├──────────────────────────────────────────────────────────────┤
│ PO #      │ Supplier    │ Warehouse │ Status    │ Ordered │ ⋮ │
│ PO-00042  │ Acme Supply │ Default   │ ORDERED   │ Jun 1   │ ⋮ │
│ PO-00041  │ Local Co    │ East      │ DRAFT     │ —       │ ⋮ │
└──────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Filters | Status multi or single `Select`; warehouse `Select` |
| Columns | poNumber (mono link), supplierName, warehouseName, status Badge, orderedAt or "—" if DRAFT, actions |
| Row click | Navigate to `/inventory/purchase-orders/[id]` |
| Create CTA | "Create purchase order" → `/inventory/purchase-orders/new` or open full-page form |

#### 5b. Create / Edit (`/inventory/purchase-orders/new`, `/inventory/purchase-orders/[id]` edit when DRAFT)

**API:** `POST /purchase-orders`, `PATCH /purchase-orders/:id` (DRAFT only)

```
┌──────────────────────────────────────────────────────────────┐
│ ← Purchase orders    Create purchase order                   │
├──────────────────────────────────────────────────────────────┤
│ Supplier name [____________]   Target warehouse [Default ▼]  │
│ Create as: (○ Save draft  ○ Mark ordered)                    │
├──────────────────────────────────────────────────────────────┤
│ Line items                              [+ Add line]         │
│ Variant [combobox ▼]   Qty ordered [___]              [✕]  │
├──────────────────────────────────────────────────────────────┤
│ [Cancel]                    [Save draft]  [Save & order]     │
└──────────────────────────────────────────────────────────────┘
```

| Field | Control |
|-------|---------|
| supplierName | `Input` required |
| warehouseId | `Select` |
| Initial status | `RadioGroup`: DRAFT vs ORDERED (maps to `status` on create) |
| Lines | Dynamic list: variant `Combobox`, `quantityOrdered` number; min 1 line |
| Actions | Save draft, Save & order (primary), Cancel → list |

#### 5c. Detail (`/inventory/purchase-orders/[id]`)

**User stories:** US-3.6, US-3.10, US-3.11  
**API:** `GET /purchase-orders/:id`, `POST .../submit`, `POST .../cancel`, `POST .../receive`

```
┌──────────────────────────────────────────────────────────────┐
│ PO-00042  [ORDERED]              [Receive goods] [Cancel]  │
│ Supplier: Acme Supply · Warehouse: Default · Ordered Jun 1  │
├──────────────────────────────────────────────────────────────┤
│ Lines                                                        │
│ Variant/SKU     │ Ordered │ Received │ Remaining             │
│ Widget SKU-001  │   50    │    20    │   30                  │
├──────────────────────────────────────────────────────────────┤
│ Receive history                                              │
│ Jun 5 · 20 units · by staff@… · Note: partial shipment      │
└──────────────────────────────────────────────────────────────┘
```

| Section | Spec |
|---------|------|
| Header | poNumber `text-2xl` + status Badge; meta line `text-sm text-muted-foreground` |
| Actions | "Receive goods" primary when ORDERED or PARTIALLY_RECEIVED; "Cancel PO" destructive outline when ORDERED/DRAFT and zero received; "Submit order" when DRAFT; "Edit" when DRAFT |
| Lines table | variant, sku, quantityOrdered, quantityReceived, remaining (computed) |
| Receipt history | `Card` list or nested table from `receipts[]` — date, qty per line, receivedBy, note |

#### 5d. Receive goods dialog

`Dialog` max-w-lg, opened from detail page.

| Field | Spec |
|-------|------|
| Per line | Remaining qty shown; `Input` quantityReceived (0 = skip line) |
| Note | Optional `Textarea` on receipt header |
| Validation | Client: each value ≤ remaining; at least one line > 0 |
| Submit | "Confirm receive" primary; success toast + refresh detail |

**Cancel PO:** `AlertDialog` — "Cancel PO-00042? This cannot be undone." Disabled with tooltip if any quantity received.

---

### 6. Reports (`/inventory/reports`)

**User stories:** US-3.7, US-3.12  
**API:** `GET /reports/stock`, `GET /reports/adjustments`, `GET /reports/export/*`

```
┌──────────────────────────────────────────────────────────────┐
│ Inventory reports                                            │
├──────────────────────────────────────────────────────────────┤
│ [Stock summary] [Adjustment history]          ← Tabs         │
├──────────────────────────────────────────────────────────────┤
│ Stock summary tab:                                           │
│ Metric cards: Total SKUs | Units on hand | Low-stock count   │
│ [Export CSV]                                                 │
│ Table: Product, Variant, SKU, Warehouse, On hand, Threshold  │
├──────────────────────────────────────────────────────────────┤
│ Adjustment history tab:                                      │
│ From [date] To [date]  [Export CSV]                          │
│ Table: Date, Product, Warehouse, Delta, Reason, Actor        │
└──────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Layout | `Tabs` — Stock summary (default), Adjustment history |
| Stock tab | 3× `MetricCard` row; export `Button` outline with `IconDownload`; full stock table (same columns as stock page) |
| Adjustments tab | Date range filter; export button passes same filters as query |
| Export | Triggers file download from export endpoints; toast "Export started" / error |

---

### 7. Inventory settings (`/inventory/settings`)

**User stories:** US-3.9  
**API:** `GET/PATCH /merchant/inventory/settings`  
**Roles:** OWNER only

```
┌──────────────────────────────────────────────────────────────┐
│ Inventory settings                                           │
├──────────────────────────────────────────────────────────────┤
│ ┌─ Reorder defaults ───────────────────────────────────────┐ │
│ │ Default reorder threshold  [  5  ]  (integer ≥ 0)      │ │
│ │ Applied when a variant has no per-variant threshold.     │ │
│ │                                    [Save]                │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Single `Card` + `Form`. STAFF: redirect or 403 empty state with link back to alerts.

---

## Catalog integration (merchant)

**User story:** US-3.14  
**Route:** `/catalog/products` — existing `ProductsTable` Sheet form  
**API:** Variant `inventory` field read-only in responses; writes ignored

### Change to product create/edit Sheet

Replace editable **Inventory** `Input` with read-only display:

```
┌─ Variant ─────────────────────────────────────┐
│ Variant name [Default    ]  SKU [SKU-001   ] │
│ Price [19.99]                               │
│ Sellable quantity  42   (read-only)    [ℹ]  │
│ └ Tooltip: Synced from default warehouse.     │
│            Adjust via Inventory → Adjustments│
└───────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Sellable qty | `Input` disabled or plain text `font-mono text-lg font-semibold` |
| Helper | `text-xs text-muted-foreground` + `Tooltip` on `IconInfoCircle` |
| Link | "Manage stock" text link → `/inventory/stock?q={sku}` |
| Create flow | Show `0` with same helper (stock created at default warehouse on first adjustment/receive) |
| Remove | Do not send `inventory` in PATCH/POST payload |

**Table column (optional):** Add "Sellable" column to products table showing default variant `inventory` with low-stock warning icon if applicable.

---

## Admin portal — Tenant inventory summary

**User story:** US-3.13  
**Route:** `/inventory/tenants/[tenantId]`  
**API:** `GET /platform/inventory/tenants/:tenantId/summary`, `.../adjustments`, `.../purchase-orders`  
**Access:** SUPER_ADMIN, PLATFORM_OPS — read-only, audit logged

### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│ ← Merchants    Acme Corp — Inventory (read-only)             │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│ │Warehouses│ │ SKUs   │ │ Units  │ │Low stock│              │
│ │    2    │ │   84   │ │  1,240 │ │    3    │              │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
├──────────────────────────────────────────────────────────────┤
│ [Overview] [Recent adjustments] [Recent POs]    ← Tabs       │
├──────────────────────────────────────────────────────────────┤
│ Overview: warehouses table (name, default, active, SKU count)│
│ Adjustments tab: last 20 adjustments (read-only table)       │
│ POs tab: last 20 POs with status badges (read-only)          │
└──────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Banner | `Alert` info variant: "Read-only support view. Changes must be made by the merchant." |
| Metrics | 4× `MetricCard` from summary API |
| Tabs | Overview (warehouses), Recent adjustments, Recent POs |
| Actions | None — no create/edit/delete buttons |
| Breadcrumb | Merchants → {businessName} → Inventory |
| Entry | Link from `/merchants/[id]` header actions: "View inventory" |

---

## Component mapping

### Merchant — screens to shadcn / shared components

| Screen | Primary components | Shared / new wrappers |
|--------|-------------------|------------------------|
| Warehouses list | `Table`, `Badge`, `DropdownMenu`, `Dialog`, `Form`, `Input`, `Textarea`, `Switch`, `Button`, `Skeleton`, `Sonner` | `WarehousesTable`, `WarehouseDialog` |
| Stock levels | `Table`, `Select`, `Input`, `Badge`, `Dialog`, `Tooltip`, `Tabs` (summary) | `StockLevelsTable`, `ReorderThresholdDialog` |
| Adjustments | `Card`, `Form`, `Select`, `Combobox`, `RadioGroup`, `Input`, `Textarea`, `Table`, `Alert`, `Popover` (date) | `AdjustmentForm`, `AdjustmentsHistoryTable` |
| Alerts | `Table`, `Badge`, `Button` | `LowStockAlertsTable` |
| PO list | `Table`, `Badge`, `Select`, `Button` | `PurchaseOrdersTable` |
| PO create/edit | `Form`, `Input`, `Select`, `Combobox`, `RadioGroup`, `Button` | `PurchaseOrderForm`, `PoLineItemsFieldArray` |
| PO detail | `Card`, `Table`, `Badge`, `Button`, `AlertDialog` | `PurchaseOrderDetail`, `ReceiveGoodsDialog`, `ReceiptHistoryList` |
| Reports | `Tabs`, `MetricCard`, `Table`, `Button`, `Popover` | `InventoryReportsTabs`, `ExportCsvButton` |
| Settings | `Card`, `Form`, `Input`, `Button` | `InventorySettingsForm` |
| Catalog sellable qty | `Sheet` (existing), `Tooltip`, `Input` disabled | Extend `ProductsTable` |

### Admin — tenant inventory

| Screen | Primary components |
|--------|-------------------|
| Tenant inventory | `MetricCard`, `Tabs`, `Table`, `Badge`, `Alert`, `Breadcrumb` (or back link) |

### Status / domain badges (add to `packages/ui` or app badges)

| Component | Variants |
|-----------|----------|
| `PurchaseOrderStatusBadge` | DRAFT, ORDERED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED |
| `StockAdjustmentReasonBadge` | DAMAGE, COUNT_CORRECTION, RETURN, OTHER |
| `LowStockStatusBadge` | OUT_OF_STOCK, LOW_STOCK |

### Shell updates

| File | Change |
|------|--------|
| `packages/ui/.../merchant-shell.tsx` | Add Inventory nav group + icons; optional alert count badge |
| `apps/admin/.../merchants/[id]/page.tsx` | "View inventory" link (implementation phase) |

### Suggested file layout (implementation reference)

```
apps/merchant/app/inventory/
  warehouses/page.tsx
  warehouses/_components/warehouses-table.tsx
  warehouses/_components/warehouse-dialog.tsx
  stock/page.tsx
  stock/_components/stock-levels-table.tsx
  adjustments/page.tsx
  adjustments/_components/adjustment-form.tsx
  adjustments/_components/adjustments-history-table.tsx
  alerts/page.tsx
  alerts/_components/low-stock-alerts-table.tsx
  purchase-orders/page.tsx
  purchase-orders/new/page.tsx
  purchase-orders/[id]/page.tsx
  purchase-orders/_components/purchase-orders-table.tsx
  purchase-orders/_components/purchase-order-form.tsx
  purchase-orders/_components/receive-goods-dialog.tsx
  reports/page.tsx
  reports/_components/inventory-reports-tabs.tsx
  settings/page.tsx
  _components/purchase-order-status-badge.tsx
  _components/stock-adjustment-reason-badge.tsx

apps/admin/app/inventory/tenants/[tenantId]/page.tsx
apps/admin/app/inventory/tenants/[tenantId]/_components/tenant-inventory-summary.tsx
```

---

## Accessibility

- All adjustment and PO forms: visible `Label` on every control; error text `aria-describedby`.
- Quantity inputs: `inputMode="numeric"`; announce validation errors via `aria-live="polite"` region.
- Status badges: text label always present (not color-only).
- Tables: `<th scope="col">`; row actions keyboard reachable via `DropdownMenu`.
- Receive dialog: focus trap; primary action disabled until valid quantities entered.
- Read-only sellable field: `aria-readonly="true"`; tooltip content available to screen readers via describedby.

---

## Out of scope (design)

- Inter-warehouse transfer UI (P2)
- Barcode scanning at receive
- Supplier master / vendor records
- In-app or email low-stock notifications (job stub only)
- Storefront inventory display changes (behavior only; no UI change)

---

## Related documents

| Document | Path |
|----------|------|
| PRD | `docs/prd/phase-3-inventory.md` |
| Architecture | `docs/architecture/phase-3-inventory.md` |
| Merchant Phase 1 patterns | `docs/design/phase-1-merchant.md` |
| Admin Phase 1 patterns | `docs/design/phase-1-admin.md` |
| Design system | `docs/design/design-system.md` |
