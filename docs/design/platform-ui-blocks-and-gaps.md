# Platform UI Blocks & Gap Closure — Design

**Version:** 1.0  
**Last updated:** 2025-06-25  
**PRD:** [platform-ui-blocks-and-gaps.md](../prd/platform-ui-blocks-and-gaps.md)  
**Architecture:** [platform-ui-blocks-and-gaps.md](../architecture/platform-ui-blocks-and-gaps.md)  
**UI spec:** `packages/ui` (no Figma)

## Overview

Two coordinated UI workstreams:

| Workstream | Design focus | Apps |
|------------|--------------|------|
| **A — Blocks refresh** | `AuthLayout` (login-03), upgraded `AdminShell` / `MerchantShell` (dashboard-01 Featured) | admin, merchant, store (auth only) |
| **B — Gap closure** | Merchant orders list + detail, CRM activities timeline + global log | merchant |

**Tokens:** `packages/ui/styles/globals.css` — `--primary`, `--muted`, `--sidebar-*`, Geist sans/mono.  
**Density:** `text-sm` body, compact tables, sticky headers per [design-system.md](./design-system.md).  
**Icons:** `@tabler/icons-react` stroke 1.5 in shells; `lucide-react` acceptable in `packages/ui`-aligned primitives.

---

## Route map

### Workstream A — Auth (no shell)

| App | Route | `AuthLayout` brand |
|-----|-------|------------------|
| `apps/admin` | `/login` | `brandTitle="MeridianERP"` · `brandSubtitle="Platform Admin"` |
| `apps/merchant` | `/login` | `brandTitle="MeridianERP"` · `brandSubtitle="Merchant Portal"` |
| `apps/merchant` | `/register` (wizard steps) | Same outer frame; inner step content swaps |
| `apps/merchant` | `/onboarding/pending` | Same muted viewport; centered `Card` (not wizard) |
| `apps/store` | `/s/[slug]/login` | `brandTitle={businessName}` · `brandHint="Powered by MeridianERP"` |
| `apps/store` | `/s/[slug]/register` | Same as store login |

**Excluded from AuthLayout:** `/bind/[token]` (mobile-first bind flow — unchanged).

### Workstream A — Shells

| App | Shell | Nav change |
|-----|-------|------------|
| `apps/admin` | `AdminShell` | Structural upgrade only; flat nav preserved |
| `apps/merchant` | `MerchantShell` | Structural upgrade + **Orders** top-level nav |

### Workstream B — Merchant (shell-wrapped)

| Route | Purpose |
|-------|---------|
| `/orders` | Storefront orders list |
| `/orders/[id]` | Order detail |
| `/crm/contacts/[id]` | Contact detail + activity timeline |
| `/crm/leads/[id]` | Lead detail + activity timeline |
| `/crm/activities` | Global activity log (P1) |

**Nav updates (MerchantShell CRM submenu):**

```
CRM
├── Contacts      → /crm/contacts
├── Companies     → /crm/companies
├── Leads         → /crm/leads
└── Activities    → /crm/activities   ← new
```

**Orders nav:** `{ href: '/orders', label: 'Orders', icon: IconReceipt }` — place after Catalog, before Distributors.

**List table row links:** Contacts and Leads tables link name/title column → detail routes.

---

## A1. `AuthLayout` (login-03 pattern)

**Location:** `packages/ui/src/components/layouts/auth-layout.tsx`  
**Reference:** [shadcn login-03](https://ui.shadcn.com/blocks/login#login-03) — structural, not pixel copy.

### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  min-h-svh bg-muted                                          │
│                                                              │
│              ┌─────────────────────────┐                     │
│              │  MeridianERP            │  brandTitle         │
│              │  Merchant Portal        │  brandSubtitle      │
│              │  Powered by MeridianERP │  brandHint (store)  │
│              └─────────────────────────┘                     │
│                                                              │
│              ┌─────────────────────────┐                     │
│              │ Card max-w-sm w-full    │                     │
│              │ ┌───────────────────┐ │                     │
│              │ │ CardHeader        │ │                     │
│              │ │ CardTitle         │ │  e.g. "Sign in"     │
│              │ │ CardDescription   │ │                     │
│              │ ├───────────────────┤ │                     │
│              │ │ {children}        │ │  Form / wizard step │
│              │ │                   │ │                     │
│              │ └───────────────────┘ │                     │
│              └─────────────────────────┘                     │
│                                                              │
│     [Don't have an account? Register]    footer slot         │
│                              [ModeToggle]  showThemeToggle   │
└──────────────────────────────────────────────────────────────┘
```

### Component mapping

| Element | packages/ui |
|---------|-------------------|
| Viewport | `div.min-h-svh.bg-muted` |
| Center stack | `div.flex.flex-col.items-center.justify-center.gap-6.p-6` |
| Brand title | `span.text-xl.font-semibold.tracking-tight` |
| Brand subtitle | `p.text-sm.text-muted-foreground` |
| Brand hint | `p.text-xs.text-muted-foreground` |
| Form container | `Card` + `CardHeader` + `CardTitle` + `CardDescription` + `CardContent` |
| Form fields | `Form`, `FormField`, `FormLabel`, `FormControl`, `FormMessage`, `Input`, `Button` |
| Primary CTA | `Button variant="default"` full width (`className="w-full"`) |
| Footer links | `Button variant="link"` or `text-sm` anchor |
| Theme toggle | `ModeToggle` pattern from `packages/ui/src/components/theme/` — `DropdownMenu` + `Button variant="outline" size="icon"` |
| Inline errors | `FormMessage` or `p.text-sm.text-destructive` |

### Per-portal content

#### Admin login (`/login`)

| Slot | Content |
|------|---------|
| `brandTitle` | MeridianERP |
| `brandSubtitle` | Platform Admin |
| Card title | Sign in |
| Fields | Email (`Input type="email"`), Password (`Input type="password"`) |
| CTA | Sign in |
| `showThemeToggle` | `true` |

#### Merchant login (`/login`)

| Slot | Content |
|------|---------|
| `brandSubtitle` | Merchant Portal |
| Card title | Sign in |
| Footer | "Don't have an account? **Register**" → `/register` |

#### Merchant register wizard (`/register`)

| Concern | Spec |
|---------|------|
| Outer frame | Single `AuthLayout` wrapper; **do not** remount on step change |
| Step indicator | `div.flex.gap-2` with three `div.h-1.flex-1.rounded-full` — active `bg-primary`, inactive `bg-muted-foreground/30` |
| Step 1 | Account: email, password, confirm password |
| Step 2 | Business: business name, legal name, contact phone |
| Step 3 | Review: read-only summary `dl` + `Checkbox` terms |
| Navigation | `Button variant="outline"` Back + `Button` Next / Submit Application |
| Validation | `FormMessage` per field; card frame stable on error |

#### Store auth (`/s/[slug]/login`, `/register`)

| Slot | Content |
|------|---------|
| `brandTitle` | `{businessName}` from store context (server-fetched) |
| `brandHint` | Powered by MeridianERP |
| Card title | Sign in / Create account |
| Footer | Link between login ↔ register |

### States

| State | UI |
|-------|-----|
| Loading (submit) | `Button` with `disabled` + optional `Spinner` if available; fields disabled |
| Auth error | `Alert variant="destructive"` or `text-destructive` below form |
| Pending onboarding | Centered `Card` on same `bg-muted` viewport — `IconClock`, title "Application Under Review", `Badge` for status |

### Responsive

- Card: `w-full max-w-sm`
- Padding: `p-6` on viewport; `p-4` on card content for narrow screens
- Touch targets on store auth CTAs: `min-h-11` (44px) per bind-flow rule

---

## A2. Upgraded shells (dashboard-01 Featured)

**Reference:** [shadcn dashboard-01](https://ui.shadcn.com/blocks/dashboard#dashboard-01) Featured layout.  
**Primitives:** Copy `SidebarProvider` stack from `packages/ui/src/components/ui/sidebar.tsx` → `packages/ui`.

### Wireframe

```
┌─ SidebarProvider ─────────────────────────────────────────────┐
│ ┌ Sidebar ─────┐ ┌ SidebarInset ───────────────────────────┐│
│ │ SidebarHeader│ │ ┌ Site header (h-14 border-b) ─────────┐ ││
│ │  portal name │ │ │ [SidebarTrigger] │ user · Sign out   │ ││
│ ├──────────────┤ │ └───────────────────────────────────────┘ ││
│ │ SidebarContent│ │ main.flex-1.p-6                          ││
│ │ SidebarGroup │ │   {children — PageHeader + page body}    ││
│ │  SidebarMenu │ │                                          ││
│ │   ├ flat item│ │                                          ││
│ │   └ submenu  │ │                                          ││
│ │ SidebarFooter│ │                                          ││
│ └──────────────┘ └──────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

### Shell component mapping

| Element | ui-spec primitive |
|---------|-------------------|
| Layout root | `SidebarProvider` |
| Sidebar panel | `Sidebar` + `collapsible="icon"` |
| Portal title | `SidebarHeader` → `SidebarMenuButton` size lg |
| Nav groups | `SidebarGroup` + `SidebarGroupLabel` (optional) + `SidebarGroupContent` |
| Nav items | `SidebarMenu` → `SidebarMenuItem` → `SidebarMenuButton` with `isActive` |
| Nested nav | `SidebarMenuSub` → `SidebarMenuSubItem` → `SidebarMenuSubButton` |
| Badge on nav child | `SidebarMenuBadge` on Inventory → Alerts (low stock count) |
| Main area | `SidebarInset` |
| Header bar | `header.flex.h-14.shrink-0.items-center.gap-2.border-b.px-4` |
| Menu toggle | `SidebarTrigger` |
| User / logout | `DropdownMenu` or inline text + `Button variant="ghost"` |
| Page content | `main` with `flex-1` + `p-6` |
| Mobile sheet | Sidebar built-in mobile `Sheet` behavior from ui-spec |
| Loading nav | `SidebarMenuSkeleton` |

### AdminShell nav (unchanged items)

| Label | href | Icon |
|-------|------|------|
| Dashboard | `/` | `IconLayoutDashboard` |
| Merchants | `/merchants` | `IconBuildingStore` |
| Orders | `/orders` | `IconReceipt` |
| Settlements | `/settlements` | `IconWallet` |
| Settings | `/settings` | `IconSettings` |

**Header extras:** "Platform" muted label; tenant switcher placeholder unchanged (non-goal).

### MerchantShell nav (add Orders)

| Label | href | Icon | Children |
|-------|------|------|----------|
| Dashboard | `/` | `IconLayoutDashboard` | — |
| CRM | `/crm/contacts` | `IconAddressBook` | Contacts, Companies, Leads, **Activities** |
| Catalog | `/catalog/products` | `IconPackage` | Products, Categories |
| Inventory | `/inventory/warehouses` | `IconBuildingWarehouse` | Warehouses, Stock, Adjustments, Alerts (badge), POs, Reports, Settings |
| **Orders** | `/orders` | `IconReceipt` | — |
| Distributors | `/distributors` | `IconUsersGroup` | — |
| Settings | `/settings` | `IconSettings` | — |

### Submenu behavior

| Behavior | Spec |
|----------|------|
| Active route | `SidebarMenuButton` / `SidebarMenuSubButton` with `isActive` when `pathname` matches |
| Group expand | CRM / Catalog / Inventory groups expanded when `pathname` starts with section prefix |
| Session persistence | `useState` or `localStorage` key per group — default expanded for active section |
| Collapsed sidebar | Icon-only mode via `collapsible="icon"`; submenus hidden; tooltips on `SidebarMenuButton` via `Tooltip` |
| Reduced motion | `motion-reduce:transition-none` on width/collapse transitions |

### Page chrome inside shell

| Element | Component |
|---------|-----------|
| Page title row | `@meridian/ui` `PageHeader` |
| Section spacing | `space-y-6` below header |
| Toasts | `Sonner` (ui-spec `sonner.tsx`) at app root |

---

## B4. Merchant orders

### Orders list (`/orders`)

```
┌─ MerchantShell ──────────────────────────────────────────────┐
│ PageHeader: "Orders"                                         │
│   description: "Storefront orders from your online store"    │
├──────────────────────────────────────────────────────────────┤
│ ┌ Table (sticky header) ───────────────────────────────────┐ │
│ │ Order ID      │ Status │ Customer    │ Total  │ Placed   │ │
│ │ ORD-abc…      │ Badge  │ jane@…      │ $42.00 │ Jun 24   │ │
│ │ ORD-def…      │ Badge  │ Guest       │ $18.50 │ Jun 23   │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

#### Table columns

| Column | Source | Component |
|--------|--------|-----------|
| Order | `id` (truncate, `font-mono text-xs`) | `TableCell` + `Link` → `/orders/[id]` |
| Status | `status` | `Badge` — see status map below |
| Customer | `customer.email` or `guestEmail` or "Guest" | `text-sm` |
| Total | `total` + `currency` | `text-sm font-medium tabular-nums` |
| Placed | `createdAt` | `text-xs text-muted-foreground` |

#### Order status badges

| `OrderStatus` | Badge variant | Label |
|---------------|---------------|-------|
| `PENDING_PAYMENT` | `outline` + amber text | Pending payment |
| `PAID` | `default` / primary | Paid |
| `FULFILLED` | custom success (`text-emerald-600`) | Fulfilled |
| `CANCELLED` | `destructive` | Cancelled |
| `REFUNDED` | `secondary` | Refunded |

#### States

| State | UI |
|-------|-----|
| Loading | `Skeleton` rows matching table row height (`h-12`) × 5 |
| Empty | `EmptyState` — title "No storefront orders yet", description "Orders from your online store will appear here.", icon `IconReceipt` |
| Error | `Alert variant="destructive"` above table |
| Row click | Entire row or order ID link navigates to detail |

### Order detail (`/orders/[id]`)

```
┌─ MerchantShell ──────────────────────────────────────────────┐
│ ← Back to orders    Order ORD-abc…          [Status Badge]     │
├──────────────────────────────────────────────────────────────┤
│ ┌ Card ──────────────┐  ┌ Card ──────────────────────────┐  │
│ │ Customer           │  │ Order summary                  │  │
│ │ Name / email       │  │ Subtotal, tax, total           │  │
│ │ Guest email        │  │ Placed · Updated               │  │
│ └────────────────────┘  └────────────────────────────────┘  │
│ ┌ Card: Line items ─────────────────────────────────────────┐ │
│ │ Table: Product │ Variant │ SKU │ Qty │ Unit │ Line total │ │
│ └───────────────────────────────────────────────────────────┘ │
│ ┌ Card (optional) ─────────────────────────────────────────┐ │
│ │ Commission · Distributor (if present in API payload)      │ │
│ └───────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

#### Component mapping

| Section | Components |
|---------|------------|
| Back link | `Button variant="ghost" size="sm"` + `IconArrowLeft` |
| Header | `PageHeader` with order ID (`font-mono`) + status `Badge` |
| Customer card | `Card`, `CardHeader`, `CardTitle`, `CardContent` — `dl` grid |
| Summary card | `Card` — currency formatted totals |
| Line items | `Card` + `Table` sticky header |
| SKU column | `font-mono text-xs` |
| Commission block | `Card` — show only when `commissionEntry` present |
| 404 | `EmptyState` or dedicated not-found: "Order not found" |

**Non-goals:** Ship, refund, cancel actions — read-only MVP.

---

## B5. CRM activities

### Shared: `ActivityTimeline` (`apps/merchant/app/crm/_components/activity-timeline.tsx`)

Used on contact and lead detail pages. Optional reuse on global activities page.

#### Wireframe (embedded on detail page)

```
┌─ MerchantShell — Contact detail ─────────────────────────────┐
│ PageHeader: "{firstName} {lastName}"    [Edit contact Sheet] │
│ Tabs or stacked sections: Profile | Activities               │
├──────────────────────────────────────────────────────────────┤
│ ┌ Card: Log activity ──────────────────────────────────────┐ │
│ │ Select type │ Textarea note │ [Log activity] Button       │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌ Card: Activity timeline ─────────────────────────────────┐ │
│ │ ● CALL · Jun 24, 2:30 PM              [Delete ⋮]        │ │
│ │   Note text…                                             │ │
│ │ ───────────────────────────────────────────────────────  │ │
│ │ ● MEETING · Jun 22, 10:00 AM          [Delete ⋮]        │ │
│ │   Note text…                                             │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

#### Create form

| Field | Component | Validation |
|-------|-----------|------------|
| Type | `Select` — CALL, NOTE, MEETING | Required |
| Note | `Textarea` rows={3} | Min 1 char; visible `Label` |
| Submit | `Button` "Log activity" | Disabled while pending |

`contactId` or `leadId` passed as hidden prop — not shown in form.

#### Timeline item

| Element | Component |
|---------|-----------|
| Type label | `Badge variant="outline"` — CALL / NOTE / MEETING |
| Timestamp | `time.text-xs.text-muted-foreground` — relative or locale datetime |
| Note body | `p.text-sm.whitespace-pre-wrap` |
| Separator | `Separator` between items |
| Delete | `DropdownMenu` → "Delete" **or** `Button variant="ghost" size="icon"` with trash icon |
| Delete confirm | `AlertDialog` — title "Delete activity?", description "This cannot be undone.", `AlertDialogCancel` + `AlertDialogAction variant="destructive"` |

#### Activity type badges

| `ActivityType` | Badge | Icon (optional) |
|----------------|-------|-----------------|
| `CALL` | `outline` | `IconPhone` |
| `NOTE` | `secondary` | `IconNote` |
| `MEETING` | `default` | `IconCalendar` |

#### States

| State | UI |
|-------|-----|
| Loading timeline | `Skeleton` blocks × 3 |
| Empty timeline | `EmptyState` compact — "No activities yet" + "Log your first call, note, or meeting above." |
| Create success | `Sonner` toast "Activity logged" + prepend to list |
| Delete success | Remove from list + toast "Activity deleted" |
| Error | `Sonner` toast destructive + inline `FormMessage` on create |

### Contact detail (`/crm/contacts/[id]`)

| Section | Content |
|---------|---------|
| Header | Contact name, email, phone, company link |
| Primary actions | `Sheet` for edit (existing pattern from phase-1-merchant) |
| Activities | `ActivityTimeline contactId={id}` |

**Data:** Server-fetch contact; activities fetched client-side or server `GET /merchant/activities` filtered by `contactId`.

### Lead detail (`/crm/leads/[id]`)

| Section | Content |
|---------|---------|
| Header | Lead title, stage `Badge`, source, linked contact |
| Stage change | Existing `DropdownMenu` / `Select` pattern |
| Activities | `ActivityTimeline leadId={id}` |

### Global activities (`/crm/activities`)

```
┌─ MerchantShell ──────────────────────────────────────────────┐
│ PageHeader: "Activities"                                     │
│   description: "All calls, notes, and meetings"              │
├──────────────────────────────────────────────────────────────┤
│ Table: Type │ Note (truncate) │ Related │ Created │ Actions  │
└──────────────────────────────────────────────────────────────┘
```

| Column | Content |
|--------|---------|
| Type | Activity type `Badge` |
| Note | Truncate 80 chars |
| Related | Contact name link → `/crm/contacts/[id]` if `contactId`; else lead ID mono link → `/crm/leads/[id]` |
| Created | `createdAt` formatted |
| Actions | `DropdownMenu` → Delete → `AlertDialog` |

**Empty:** `EmptyState` — "No activities yet" with link to Contacts.

---

## Cross-cutting component index

| UI need | ui-spec path | packages/ui |
|---------|--------------|-------------|
| Auth frame | — | `AuthLayout` (new) |
| Sidebar shell | `sidebar.tsx` | `sidebar.tsx` (copy) |
| Tables | `table.tsx` | `table.tsx` |
| Forms | `form.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx` | same |
| Dialogs | `alert-dialog.tsx`, `dialog.tsx` | `dialog.tsx` + add `alert-dialog` |
| Feedback | `sonner.tsx` | app-level Toaster |
| Status | `badge.tsx` | `badge.tsx` |
| Page chrome | — | `PageHeader`, `EmptyState`, `MetricCard` |
| Loading | `skeleton.tsx` | add if missing |

---

## Accessibility checklist

- [ ] Auth inputs have visible `Label` (not placeholder-only)
- [ ] `SidebarTrigger` has accessible name; mobile sidebar traps focus in `Sheet`
- [ ] Order status and activity type conveyed by text + color (`Badge` text)
- [ ] `AlertDialog` focus trap on delete confirm
- [ ] Table headers `scope="col"`
- [ ] Keyboard: Tab through auth form → CTA; Enter submits
- [ ] `prefers-reduced-motion`: sidebar width transition disabled
- [ ] Focus rings on all interactive elements (`ring-ring focus-visible:ring-2`)

---

## Design decisions (resolved)

| Question | Decision |
|----------|----------|
| Store auth brand (PRD #2) | **Merchant `businessName` primary**; `brandHint="Powered by MeridianERP"` |
| Merchant orders scope (PRD #5) | **List + detail** in same delivery |
| CRM activities placement (PRD #6) | **Timeline on contact/lead detail** + global `/crm/activities` list |
| Activity delete (PRD #7) | **Hard delete** with `AlertDialog` confirm |
| Admin reject label (PRD #10) | Request field `reason`; **display label stays "Rejection reason"** (user-friendly) |
| Shell source (PRD #1) | Copy ui-spec `sidebar.tsx` → `packages/ui` |
| Theme on auth | `showThemeToggle={true}` on admin/merchant; store auth optional (match portal root) |

---

## Out of scope (design)

| Item | Note |
|------|------|
| Store checkout / guest cart UI | Client contract fix only — no layout change |
| Admin reject dialog | Field rename in payload only |
| StoreShell catalog/cart chrome | Auth pages only |
| Dashboard charts / new metrics | Existing placeholders unchanged |
| Activity edit after create | Not in API |
| Order fulfillment actions | Read-only MVP |

---

## Implementation order (design sign-off)

1. **B P0** — No new screens; contract fixes only  
2. **A** — `AuthLayout` → sidebar copy → shell refactor (all portals visually shift together)  
3. **B P1** — Orders routes → CRM detail routes → `ActivityTimeline` → global activities → list row links

---

## Related docs

| Doc | Path |
|-----|------|
| Phase 1 merchant wireframes | `docs/design/phase-1-merchant.md` |
| Phase 1 admin wireframes | `docs/design/phase-1-admin.md` |
| Design system | `docs/design/design-system.md` |
| UI exports | `packages/ui/src/index.ts` |
