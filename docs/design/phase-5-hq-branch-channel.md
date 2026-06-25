# Phase 5 — HQ Branch Channel UI Design

**Apps:** `apps/admin`, `apps/merchant`, `apps/distributor`, `apps/store`  
**PRD:** `docs/prd/phase-5-distribution-and-allocation.md`  
**Architecture:** `docs/architecture/phase-5-distribution-and-allocation.md`  
**Showcase:** `apps/ui-spec/src/app/page.tsx` → **Phase 5 — Order fulfillment**  
**Version:** 1.0 · 2025-06-25

## Design read

Factory → channel partner → branch store → consumer. Data-dense ERP surfaces with Bento KPI strips on dashboards and funds views. **No merchant `/distributors` nav** — channel partners are platform-managed. Currency display: **CNY, 2 dp**, `tabular-nums`. Icons: `@tabler/icons-react` in shells; `lucide-react` in ui-spec composites.

---

## Route map & navigation

### Admin (`AdminShell`)

| Nav item | Route | PRD stories |
|----------|-------|-------------|
| Dashboard | `/` | (existing) |
| Merchants | `/merchants`, `/merchants/[id]` | US-5.6 recruit bind on approve |
| **Distributors** | `/distributors`, `/distributors/[id]` | US-5.3, US-5.4, US-5.7 |
| **Master catalog** | `/catalog/master-skus` | US-5.15 |
| **Allocations** | `/allocations`, `/allocations/new`, `/allocations/[id]` | US-5.16 |
| **Replenishment** | `/replenishment` | US-5.17 review queue |
| **Funds** | `/funds` | US-5.9 |
| **Orders** | `/orders` (tabs: All · Delivery queue) | US-5.23, US-5.24 |
| **Withdrawals** | `/withdrawals` | US-5.13 |
| Platform CRM | `/crm/contacts`, `/crm/companies`, `/crm/leads` | US-5.14 |
| Settings | `/settings` | (existing) |

### Merchant (`MerchantShell`) — **no Distributors nav**

| Nav item | Route | PRD stories |
|----------|-------|-------------|
| Dashboard | `/` | (existing) |
| Orders | `/orders` (tabs: All · **Pickup verify**) | US-5.21, US-5.22 |
| **Funds** | `/funds` | US-5.18 |
| **Replenishment** | `/replenishment`, `/replenishment/new` | US-5.17 |
| Catalog, Inventory, CRM, Settings | (existing) | — |
| ~~Distributors~~ | **Removed / 403** | US-5.3 |

### Distributor (`DistributorShell`)

| Nav item | Route | PRD stories |
|----------|-------|-------------|
| Dashboard | `/` | US-5.11 summary |
| **Branches** | `/branches` | US-5.10 |
| Commissions | `/commissions` | US-5.11 ledger |
| **Withdrawals** | `/withdrawals` | US-5.12 |
| Login | `/login` | (existing) |

### Store (`StoreShell`)

| Route | PRD stories |
|-------|-------------|
| `/` | US-5.1 ✅ store picker |
| `/s/[slug]/checkout` | US-5.19 fulfillment picker |
| `/s/[slug]/orders/[id]/confirmation` | US-5.20 pickup QR/code |

---

## Shared composites (`@meridian/ui`)

Propagate from ui-spec showcase (`apps/ui-spec/src/components/`).

| Component | Location (target) | Showcase |
|-----------|-------------------|----------|
| `OrderListFrame` | `packages/ui/src/components/orders/order-list-frame.tsx` | `#order-list-frame` |
| `FulfillmentTypeBadge` | `packages/ui/src/components/orders/fulfillment-type-badge.tsx` | `#fulfillment-type-badge` |
| `PickupVerifyDialog` | `packages/ui/src/components/orders/pickup-verify-dialog.tsx` | `#pickup-verify-dialog` |
| `DeliveryShipDialog` | `packages/ui/src/components/orders/delivery-ship-dialog.tsx` | `#delivery-ship-dialog` |

### OrderListFrame

**Purpose:** Single table chrome for admin + merchant order lists (US-5.25).

**Composition:** `FW-LIST` + `Tabs` + filter row + `Table` + `Pagination` + `EmptyState`.

```
┌─────────────────────────────────────────────────────────────┐
│ Page title (optional — parent may use ListPageFrame)        │
│ [BentoListHeader KPI strip — optional headerSlot]           │
├─────────────────────────────────────────────────────────────┤
│ [ All | Pickup | Delivery ]                    (showTabs)   │
│ [ Search________ ] [ Status ▼ ] [ filterSlot ]              │
├─────────────────────────────────────────────────────────────┤
│ Order │ Branch* │ Customer │ Fulfillment │ Status │ Total │
│ ...   │         │          │ Badge       │ Badge  │       │
│                                    [ Verify | Ship ]       │
├─────────────────────────────────────────────────────────────┤
│                    « Prev  1  2  3  Next »                  │
└─────────────────────────────────────────────────────────────┘
* showMerchantColumn — admin delivery queue only
```

| Prop | Admin delivery | Merchant pickup | Merchant all |
|------|----------------|-----------------|--------------|
| `activeTab` | `delivery` | `pickup` | `all` |
| `showMerchantColumn` | `true` | `false` | `false` |
| `renderRowAction` | Ship → `DeliveryShipDialog` | Verify → `PickupVerifyDialog` | View link |
| `filterSlot` | Branch `Select` | — | — |

**States**

| State | Pattern |
|-------|---------|
| Loading | `Skeleton` rows — `ListPageFrame` `isLoading` |
| Empty | `EmptyState` — dashed border, helper copy per tab |
| Error | `Alert variant="destructive"` above frame |

### FulfillmentTypeBadge

| `type` | Variant | Icon | Label (en) |
|--------|---------|------|------------|
| `PICKUP` | `secondary` | Store | Pickup |
| `DELIVERY` | `outline` | Truck | Delivery |

Status is **not** encoded in this badge — pair with order status `Badge` (`PAID`, `FULFILLED`).

### PickupVerifyDialog

**Actor:** Branch staff (`MERCHANT_OWNER`, `MERCHANT_STAFF`).

**Composition:** `Dialog` + order summary `dl` + `InputOTP` (6) + `Scan QR` outline button + footer actions.

| Element | Spec |
|---------|------|
| OTP | 6 numeric digits; `maxLength={6}` |
| Scan QR | `min-h-11` (44px touch); opens camera (P0: button stub → implement `getUserMedia`) |
| Primary CTA | "Confirm pickup" — disabled until 6 digits |
| Error | `text-destructive text-sm` below OTP, `role="alert"` |
| Success | Close dialog + toast + refresh list |

**Idempotent retry:** Same code on fulfilled order shows success toast, no double decrement (API).

### DeliveryShipDialog

**Actor:** Platform admin (`SUPER_ADMIN`, `PLATFORM_OPS`).

**Composition:** `AlertDialog` + order/address summary + line item list + stock warning slot.

| Element | Spec |
|---------|------|
| Lines list | `ring-1 ring-border` divided rows; SKU in `font-mono text-xs` |
| Stock warning | `text-amber-600` when MasterSku insufficient |
| Confirm | Destructive-adjacent primary — "Confirm ship" |
| Cancel | `AlertDialogCancel` |

---

## Admin screens

### Distributors list (`/distributors`)

**Framework:** `ListPageFrame` + `BentoListHeader` (active partners, recruited branches 30d).

**Ui-spec refs:** FW-LIST, Data Table, Badges, Pagination.

| Column | Content |
|--------|---------|
| Name | Link to detail |
| Contact | email / phone |
| Commission | `PERCENT 12%` or `FIXED ¥50` |
| Portal | `Badge` enabled/disabled |
| Status | Active / Inactive |
| Branches | Count `tabular-nums` |
| Actions | DropdownMenu: View, Deactivate |

**CTA:** Primary "Add channel partner" → `/distributors/new`.

**Empty:** `EmptyState` — "No channel partners yet" + CTA.

### Distributor detail (`/distributors/[id]`)

**Framework:** `BentoDetailHero` + `Tabs`.

| Tab | Content |
|-----|---------|
| Overview | Contact, commission rate/type, portal toggle, active flag |
| **Invite codes** | Table: code (mono), created, uses, revoked; Generate + Copy link `{MERCHANT_APP_URL}/register?invite={CODE}` |
| Branches | Read-only recruited branch table (name, slug, status, GMV) |
| Activity | Commission ledger excerpt (P1) |

**Generate code:** `Dialog` — confirm → toast with copyable code.

### Merchant approve — recruit binding (`/merchants/[id]`)

Extend existing approve flow.

| Element | Spec |
|---------|------|
| Field | `Select` channel partner (nullable "Unbound") |
| Default | Pre-fill from `recruitedByDistributorId` pending onboarding |
| Override | `Textarea` reason required when changing partner on approved branch |
| Ui-spec | Approve `Dialog` pattern (admin merchants) |

### Master SKUs (`/catalog/master-skus`)

**Framework:** `ListPageFrame` + filters.

| Column | Notes |
|--------|-------|
| SKU code | `font-mono text-xs` |
| Name | |
| On hand | `tabular-nums` |
| Shipped (cum.) | `tabular-nums` |
| Cost / Wholesale / Retail | CNY, right-aligned |
| Status | Active `Badge` |

**Form (Sheet):** `FormPageFrame` — all numeric fields with validation errors inline.

### Allocations (`/allocations`)

**List columns:** ID, branch, status (`DRAFT`/`ISSUED`/`CONFIRMED`), lines count, issued date.

**Create (`/allocations/new`):** Branch `Combobox` + dynamic line rows (Master SKU select + qty). Issue CTA when stock OK.

**Detail:** Status timeline + line table; merchant confirm is out of band (merchant receives `ISSUED`).

### Replenishment review (`/replenishment`)

Admin queue: branch, requested date, status, actions Approve / Reject.

**Reject:** `Dialog` + required `Textarea` reason.

### Funds dashboard (`/funds`)

**Framework:** `BentoDashboardFrame`.

```
┌──────────┬──────────┬──────────┬──────────┐
│ Platform │ Wholesale│ Commission│ Pending  │
│ GMV      │ revenue  │ liability │ withdraw │
├──────────┴──────────┴──────────┴──────────┤
│ Activity chart (BentoChartTile span-2)    │
├───────────────────────────────────────────┤
│ Date range filter [ From ] [ To ] [Apply] │
└───────────────────────────────────────────┘
```

**Empty chart:** Flat zero bars + caption "No orders in range".

### Delivery queue (`/orders` · Delivery tab)

**Framework:** `ListPageFrame` wrapping `OrderListFrame`.

- `activeTab="delivery"`, `showMerchantColumn=true`
- Row action: **Ship** → `DeliveryShipDialog`
- Filters: status `PAID`, branch select

**Order detail (optional `/orders/[id]`):** `DetailPageFrame` + delivery address card + line items + Ship CTA.

### Withdrawals (`/withdrawals`)

**Framework:** `ListPageFrame` + status tabs (Pending · Approved · Rejected).

| Column | Content |
|--------|---------|
| Partner | Name |
| Amount | CNY `tabular-nums` |
| Requested | datetime |
| Note | truncated |
| Actions | Approve / Reject (pending only) |

**Reject:** `Dialog` + required reason `Textarea`.

---

## Merchant screens

### Funds (`/funds`)

**Framework:** `BentoDashboardFrame` — branch formula tiles.

| Tile | Field |
|------|-------|
| Branch GMV | `branch_GMV` |
| Allocation cost | `branch_allocation_cost` |
| Delivery cost | `branch_delivery_cost` |
| Payable commission | `branch_payable_commission` |
| Net estimate | `branch_net_estimate` — emphasize `text-2xl font-semibold` |

Helper copy when zeros: "Sales and allocations will appear here."

### Replenishment (`/replenishment`)

**List:** status `Badge`, requested date, line count.

**New request (`/replenishment/new`):** `FormPageFrame` — add lines (master SKU or mapped product + qty), submit → `PENDING`.

**Detail:** status + rejection reason `Alert` if rejected.

### Orders — Pickup verify tab (`/orders`)

**Framework:** `ListPageFrame` + `OrderListFrame`.

- Default tab: **Pickup verify**
- Rows: `PAID` + `PICKUP` + unverified only
- Extra column hint: masked code `••••42` (last 2 digits) — never full code in list
- Action: **Verify** → `PickupVerifyDialog`

**All orders tab:** Standard list with `FulfillmentTypeBadge`; link to detail.

---

## Distributor screens

### Branches (`/branches`)

**Framework:** `ListPageFrame` + `BentoListHeader` (count, 30d GMV).

| Column | Content |
|--------|---------|
| Store name | |
| Slug | `font-mono text-xs` |
| Status | onboarding `Badge` |
| 30d GMV | CNY |
| Lifetime GMV | CNY |

**Empty:** `EmptyState` — "No recruited branches yet" + copy explaining Admin-issued invite link (read-only; no generate in distributor portal).

### Withdrawals (`/withdrawals`)

**Summary row:** Available balance (large), accrued, settled, withdrawn.

**Request form:** `Card` — amount `Input` (CNY), optional note `Textarea`, Submit.

**History table:** amount, status `Badge`, date, rejection reason.

**Validation errors:** inline below amount field.

---

## Store screens

### Checkout — fulfillment picker (`/s/[slug]/checkout`)

Insert **before** payment step in `FormPageFrame`.

```
┌─────────────────────────────────────┐
│ How would you like to receive?      │
│ ○ Pick up at store                    │
│   Free · Ready when branch verifies │
│ ○ Delivery                          │
│   Shipped from HQ · fee TBD         │
├─────────────────────────────────────┤
│ [Delivery address fields — if DELIVERY]│
│ Name, Phone, Address line 1/2, City  │
└─────────────────────────────────────┘
```

**Ui-spec refs:** Radio Group & Slider section, Form Controls (`Label` + `Input`).

| State | Behavior |
|-------|----------|
| `PICKUP` | Hide address block |
| `DELIVERY` | All address fields required; 44px min touch on inputs |
| Submit | Block until fulfillment + address valid |

### Confirmation — pickup QR/code (`/s/[slug]/orders/[id]/confirmation`)

Extend `DetailPageFrame` below payment banner.

**When `PAID` + `PICKUP` + not verified:**

```
┌─────────────────────────────────────┐
│ Pick up at {branch name}            │
│ Show this code at the counter       │
│                                     │
│     ┌─────────┐    4 8 2 9 1 6      │
│     │ QR code │    (text-3xl mono)  │
│     └─────────┘                     │
│ Expires when verified               │
└─────────────────────────────────────┘
```

**Ui-spec refs:** Card + `Input OTP` visual for digit spacing; QR via `qrcode` lib in implementation.

| State | UI |
|-------|-----|
| Not paid | Hide credentials; show payment status only |
| Fulfilled | `Badge` "Picked up" + `pickupVerifiedAt`; hide QR/code |
| Delivery | Show "Shipped from HQ" + address summary; no pickup block |

---

## Component mapping (implementation)

| Screen | Shell / frame | Key components |
|--------|---------------|----------------|
| Admin distributors | `ListPageFrame` | `Table`, `Badge`, `Dialog` |
| Admin funds | `BentoDashboardFrame` | `BentoMetricTile`, `BentoChartTile` |
| Admin delivery queue | `ListPageFrame` | `OrderListFrame`, `DeliveryShipDialog` |
| Admin withdrawals | `ListPageFrame` | `Table`, `Dialog`, `Textarea` |
| Merchant funds | `BentoDashboardFrame` | `BentoMetricTile` |
| Merchant pickup | `ListPageFrame` | `OrderListFrame`, `PickupVerifyDialog` |
| Merchant replenishment | `FormPageFrame` | `Table`, `Select`, `Button` |
| Distributor branches | `ListPageFrame` | `Table`, `EmptyState` |
| Distributor withdrawals | `BentoListHeader` + form `Card` | `Input`, `Textarea` |
| Store checkout | `FormPageFrame` | `RadioGroup`, `Input`, `Label` |
| Store confirmation | `DetailPageFrame` | `Card`, QR, mono code |

---

## States reference

| Surface | Loading | Empty | Error |
|---------|---------|-------|-------|
| Order lists | `Skeleton` × 5 | `EmptyState` per tab | `Alert destructive` |
| Funds dashboards | `BentoMetricTile` skeleton | Zeros + helper text | Banner alert |
| Verify dialog | Button "Verifying…" | — | Inline OTP error |
| Ship dialog | Button "Shipping…" | — | Stock warning amber |
| Invite generate | Button disabled | — | Toast error |

---

## Responsive & accessibility

- ERP portals: tables scroll horizontally on `sm`; sticky header via `Table` in `ring-1` container.
- Store checkout / confirmation: single column; pickup QR min 160×160px.
- All fulfillment choices: visible `Label` + `RadioGroupItem`, not icon-only.
- Status: text in `Badge`, not color alone.
- `prefers-reduced-motion`: no QR scan animation.
- Pickup verify scan button: `min-h-11` (44px).

---

## Tokens & density

- Page title: `text-2xl font-semibold tracking-tight`
- Body: `text-sm`; table meta: `text-xs text-muted-foreground`
- Money: `tabular-nums`; IDs/codes: `font-mono text-xs`
- Surfaces: `rounded-xl ring-1 ring-border` (dark: alpha hairlines per design system)
- Primary CTA: `Button` default (blue `--primary`)

---

## Ui-spec example index

| Pattern | Showcase section |
|---------|------------------|
| Table list chrome | Data Table, FW-LIST |
| Order fulfillment composites | **Phase 5 — Order fulfillment** |
| Dashboard KPIs | Bento Grid / Dashboard |
| Confirm destructive | Alert Dialog |
| OTP entry | Advanced Components → Input OTP |
| Forms | Form Controls, Radio Group |
| Empty lists | Feedback patterns + `EmptyState` in packages/ui |
| Auth / register invite | FW-AUTH + read-only invite `Input` on register |

---

## Out of scope (design)

- Merchant distributor CRUD UI (removed)
- Customer QR bind commission UI
- Real payout rails UI
- Carrier tracking
- Multi-level distributor tree visualization
