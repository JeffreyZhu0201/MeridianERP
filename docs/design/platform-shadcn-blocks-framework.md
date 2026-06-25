# Platform shadcn Blocks Framework — Design Spec

**Version:** 1.0  
**Last updated:** 2025-06-25  
**Status:** Design complete — ready for architecture + ui-spec showcase  
**PRD:** [platform-shadcn-blocks-framework.md](../prd/platform-shadcn-blocks-framework.md)  
**Canonical UI:** `apps/ui-spec/src/app/page.tsx`, `globals.css`, `mode-toggle.tsx`  
**shadcn blocks:** [dashboard-01](https://ui.shadcn.com/blocks/dashboard#dashboard-01), [sidebar-03](https://ui.shadcn.com/blocks/sidebar#sidebar-03), [login-03](https://ui.shadcn.com/blocks/login#login-03)

---

## Design read

MeridianERP is a **data-dense B2B ERP**, not a marketing site. Page frameworks standardize chrome so 42+ routes share the same sidebar behavior, page headers, table density, auth canvas, and theme control. Visual language comes **only** from ui-spec tokens and showcase compositions — no Figma, no one-off layouts.

**Dials:** DESIGN_VARIANCE 5 · MOTION_INTENSITY 3 · VISUAL_DENSITY 7

---

## Framework taxonomy

| Framework ID | shadcn block | Target `packages/ui` | ui-spec section (new unless noted) |
|--------------|--------------|----------------------|-------------------------------------|
| **FW-SHELL-ERP** | dashboard-01 Featured + sidebar-03 | `AdminShell`, `MerchantShell` (replace `ShellFrame` stack) | **Framework: ERP Shell** |
| **FW-AUTH** | login-03 | `AuthLayout` (+ `ModeToggle` slot) | **Framework: Auth (login-03)** |
| **FW-AUTH-STATUS** | login-03 canvas, no form | `AuthLayout` variant `statusOnly` | **Framework: Auth Status** |
| **FW-DASHBOARD** | dashboard-01 metric row | `MetricCard` grid wrapper | **Framework: Dashboard** |
| **FW-LIST** | dashboard-01 data table | `ListPage` composition | **Framework: List Page** |
| **FW-DETAIL** | dashboard-01 cards + table | `DetailPage` composition | **Framework: Detail Page** |
| **FW-FORM** | Card-contained form | `FormPage` composition | **Framework: Form Page** |
| **FW-SETTINGS** | settings stacked sections | `SettingsPage` composition | **Framework: Settings** |
| **FW-STORE** | consumer header (non-ERP) | `StoreShell` upgrade | **Framework: Store Shell** |
| **FW-BIND** | login-03 simplified card | `BindLayout` | **Framework: Bind Card** |

**Sidebar choice:** **sidebar-03** is canonical (collapsible groups with submenus for merchant CRM / Catalog / Inventory). sidebar-07 is fallback only if nested groups prove inaccessible — architect documents the switch.

---

## Framework wireframes (ASCII)

### FW-SHELL-ERP — ERP authenticated shell

Reference: shadcn **dashboard-01** (layout) + **sidebar-03** (nav).

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [≡] SidebarTrigger │ Breadcrumb…                    [Tenant?] [ModeToggle] [User ▼] │  h-14 header
├─────────────┬────────────────────────────────────────────────────────────┤
│ Sidebar     │  ┌─ Page framework slot (FW-DASHBOARD | LIST | DETAIL | …) ─┐
│ ┌─────────┐ │  │                                                          │
│ │ Logo    │ │  │  {children — never duplicate shell chrome inside}       │
│ ├─────────┤ │  │                                                          │
│ │ Nav     │ │  └──────────────────────────────────────────────────────────┘
│ │ ▼ CRM   │ │     p-4 md:p-6 · space-y-6 · overflow-auto
│ │   Contacts│
│ │   Leads   │ │  Mobile: Sidebar → Sheet (focus trap), SidebarTrigger in header
│ │ Dashboard │ │
│ └─────────┘ │ │
│ [collapse]  │ │
└─────────────┴────────────────────────────────────────────────────────────┘
```

**Components:** `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarMenu`, `SidebarMenuSub` (sidebar-03), `SidebarInset`, `SidebarTrigger`, `Separator`, `Breadcrumb`, `DropdownMenu` (user), `ModeToggle`.

**ui-spec mapping:** New **Framework: ERP Shell** section; primitives from existing `sidebar.tsx`. Header `ModeToggle` mirrors showcase page header (`page.tsx` L177–179).

---

### FW-AUTH — Login / register

Reference: shadcn **login-03**.

```
┌─────────────────────────────────────────────────────────────┐
│                                          [ModeToggle] fixed │  top-right, z-50
│                                                             │
│              ┌───┐                                          │
│              │ M │  MeridianERP                             │
│              └───┘  {subtitle — portal or store name}       │
│                                                             │
│         ┌─────────────────────────────────────┐             │
│         │  Card (border shadow-sm)            │             │
│         │  Form · Input · Button full-width   │             │
│         └─────────────────────────────────────┘             │
│              footer links (register, etc.)                  │
│                                                             │
│         bg-muted · min-h-svh · p-6 md:p-10                  │
└─────────────────────────────────────────────────────────────┘
```

**Components:** `AuthLayout`, `Card`, `CardContent`, `Form`, `Input`, `Label`, `Button`, `ModeToggle`.

**ui-spec mapping:** **Framework: Auth** — elevate `Form Controls` card (`page.tsx` Form Controls) inside login-03 canvas; **Buttons** for CTA variants.

**Register wizard:** Same outer FW-AUTH frame; only inner `CardContent` swaps per step (stable brand block + `ModeToggle`).

---

### FW-AUTH-STATUS — Onboarding pending / store landing

```
┌─────────────────────────────────────────────────────────────┐
│                                          [ModeToggle] fixed │
│              ┌───┐                                          │
│              │ M │  MeridianERP                             │
│              └───┘  {context subtitle}                      │
│         ┌─────────────────────────────────────┐             │
│         │  Badge (status)                     │             │
│         │  title + description                │             │
│         │  Alert (info | destructive)         │             │
│         │  [optional CTA Button]              │             │
│         └─────────────────────────────────────┘             │
│         bg-muted · min-h-svh                                │
└─────────────────────────────────────────────────────────────┘
```

**Components:** `AuthLayout` (`statusOnly`), `Card`, `Badge`, `Alert`, `Button`, `ModeToggle`.

**ui-spec mapping:** **Framework: Auth Status** — `Feedback & Progress` Alert variants (`page.tsx` L580–592) + `Badges`.

---

### FW-DASHBOARD — Portal home / reports

```
┌─ inside FW-SHELL-ERP ───────────────────────────────────────┐
│ PageHeader: "Dashboard"                    [optional action] │
│                                                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │ MetricCard│ │ MetricCard│ │ MetricCard│ │ MetricCard│         │
│ │ label     │ │ label     │ │ label     │ │ label     │         │
│ │ value     │ │ value     │ │ value     │ │ value     │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│ grid: gap-4 md:grid-cols-2 lg:grid-cols-4                   │
│                                                              │
│ ┌─ Card (optional chart placeholder) ─────────────────────┐ │
│ │ CardHeader · CardTitle                                    │ │
│ │ CardContent · h-48 bg-muted/30 rounded-lg (placeholder)  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ optional embedded FW-LIST table (reports) ──────────────┐ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Components:** `PageHeader`, `MetricCard`, `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Table` (reports only).

**ui-spec mapping:** **Framework: Dashboard** — new grid using `MetricCard` pattern from `packages/ui`; `Card` from showcase Cards.

---

### FW-LIST — Entity lists

```
┌─ inside FW-SHELL-ERP (or FW-STORE for cart) ────────────────┐
│ PageHeader: "{Entity}"              [Primary action Button] │
│                                                              │
│ ┌─ optional filter row ─────────────────────────────────────┐│
│ │ Input (search) · Select (status) · Badge filters          ││
│ └───────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─ Table (sticky header) ───────────────────────────────────┐
│ │ THEAD · text-xs uppercase text-muted-foreground            │
│ │ TBODY · text-sm · Badge in status cells                      │
│ │ row · DropdownMenu actions                                   │
│ └──────────────────────────────────────────────────────────────┘
│ Pagination (bottom)                                          │
└──────────────────────────────────────────────────────────────┘

States:
  Loading → Skeleton rows (match row height, Feedback & Progress)
  Empty   → EmptyState (icon + title + CTA)
  Error   → Alert variant="destructive" below PageHeader
```

**Components:** `PageHeader`, `Input`, `Select`, `Badge`, `Table`, `DropdownMenu`, `Pagination`, `Skeleton`, `EmptyState`, `Alert`.

**ui-spec mapping:** **Framework: List Page** — compose from **Data Table** (`page.tsx` L500–537), **Form Controls** (Input/Select), **Badges**, **Feedback & Progress** (Skeleton, Alert).

---

### FW-DETAIL — Record detail

```
┌─ inside FW-SHELL-ERP or FW-STORE ───────────────────────────┐
│ Breadcrumb: Parent › Current                                  │
│ PageHeader: "{Record name}"    [Badge status] [Actions…]      │
│                                                              │
│ ┌─ metadata grid (1–2 col) ─────────────────────────────────┐
│ │ Card · CardHeader · CardTitle                             │
│ │ CardContent · dl grid text-sm                             │
│ └───────────────────────────────────────────────────────────┘
│                                                              │
│ Tabs (optional): Overview | Lines | Activity                 │
│ ┌─ Tab panel: Card sections or embedded Table ──────────────┐ │
│ │ Table (line items, stock, distributors)                    │ │
│ └────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────┘
```

**Components:** `Breadcrumb`, `PageHeader`, `Badge`, `Button`, `Card`, `Tabs`, `Table`, `Alert` (rejection reason), `Dialog` (destructive confirm).

**ui-spec mapping:** **Framework: Detail Page** — **Tabs & Accordion** + **Data Table** + **Breadcrumb** (import in showcase if not visible) + **Dialogs & Overlays**.

---

### FW-FORM — Create / edit / checkout

```
┌─ inside FW-SHELL-ERP or FW-STORE ─────────────────────────────┐
│ PageHeader: "New purchase order"              [Cancel link]   │
│                                                              │
│ ┌─ Card ────────────────────────────────────────────────────┐ │
│ │ Form · space-y-4                                           │ │
│ │ Label + Input / Select / Textarea                          │ │
│ │ FormMessage (destructive text-sm)                          │ │
│ │ CardFooter: [Secondary] [Primary submit]                   │ │
│ └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

Store checkout: same structure; primary Button min-h-11 (44px).
Combined form+list (/inventory/adjustments): FW-FORM Card above FW-LIST Table.
```

**Components:** `PageHeader`, `Card`, `CardFooter`, `Form`, `Input`, `Select`, `Textarea`, `Label`, `Button`.

**ui-spec mapping:** **Framework: Form Page** — **Form Controls** (`page.tsx` L273+).

---

### FW-SETTINGS — Settings pages

```
┌─ inside FW-SHELL-ERP ─────────────────────────────────────────┐
│ PageHeader: "Settings"                                       │
│                                                              │
│ ┌─ Card ────────────────────────────────────────────────────┐ │
│ │ CardHeader · CardTitle "Profile"                          │ │
│ │ CardContent · form fields or read-only rows                 │ │
│ └────────────────────────────────────────────────────────────┘ │
│ Separator (my-6)                                             │
│ ┌─ Card ────────────────────────────────────────────────────┐ │
│ │ CardHeader · CardTitle "Notifications"                    │ │
│ │ CardContent · Switch rows (label + description + Switch)  │ │
│ └────────────────────────────────────────────────────────────┘ │
│ space-y-6 between sections                                   │
└──────────────────────────────────────────────────────────────┘
```

**Components:** `PageHeader`, `Card`, `Separator`, `Switch`, `Label`, `Input`, `Button`.

**ui-spec mapping:** **Framework: Settings** — **Form Controls** Switch + **Card** stacking.

---

### FW-STORE — Consumer storefront shell

**Not** FW-SHELL-ERP. No sidebar.

```
┌──────────────────────────────────────────────────────────────┐
│ {StoreName}          Shop · Cart · Account    [ModeToggle] [Cart] [User] │  sticky h-14
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   max-w-6xl mx-auto · page framework slot                    │
│   (catalog grid | FW-DETAIL PDP | FW-LIST cart | FW-FORM)    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│            footer · text-xs text-muted-foreground            │
└──────────────────────────────────────────────────────────────┘
```

**Components:** `StoreShell` (upgrade in place), `Link`, `Badge` (cart count), `ModeToggle`, `Button`.

**ui-spec mapping:** **Framework: Store Shell** — new showcase; cart affordance `size-11` (44px) matches existing `StoreShell`.

---

### FW-BIND — QR bind (mobile-first)

```
┌──────────────────────────────────────┐
│                       [ModeToggle]   │  fixed top-right
│                                      │
│      ┌────────────────────────┐      │
│      │ Card                   │      │
│      │ title                  │      │
│      │ description            │      │
│      │ Skeleton (loading)     │      │
│      │ [Primary CTA min-h-11] │      │
│      │ Alert on error         │      │
│      └────────────────────────┘      │
│      max-w-md mx-auto · min-h-svh    │
│      bg-muted · p-6                  │
│      no sidebar                      │
└──────────────────────────────────────┘
```

**Components:** `Card`, `Button` (size `lg`, `min-h-11 w-full`), `Skeleton`, `Alert`, `ModeToggle`.

**ui-spec mapping:** **Framework: Bind Card** — **Feedback & Progress** Skeleton + Alert + **Buttons** primary full-width.

---

## Theme & ModeToggle placement

### ThemeProvider (all portals)

Wrap each app root layout:

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
```

Pattern from `apps/ui-spec/src/components/theme-provider.tsx`. Use `suppressHydrationWarning` on `<html>` per next-themes.

### ModeToggle component

Copy API from `apps/ui-spec/src/components/mode-toggle.tsx`:

- `Button variant="outline" size="icon"`
- `DropdownMenu` with Light / Dark / System
- Sun/Moon icons with `sr-only` "Toggle theme"
- `DropdownMenuContent align="end"`

Export from `packages/ui` as `ModeToggle` (re-export or thin wrapper).

### Placement rules

| Surface | Position | DOM structure | Notes |
|---------|----------|---------------|-------|
| **FW-SHELL-ERP header** | Far right of header actions, **before** user menu | `header > … > ml-auto flex items-center gap-2 > ModeToggle > UserDropdown` | Admin: after optional tenant switcher placeholder. Merchant: before user email / sign out. |
| **FW-AUTH / FW-AUTH-STATUS** | **Fixed** top-right | `absolute right-4 top-4 z-50` on muted canvas | Does not scroll with card. Same on store auth. |
| **FW-BIND** | Fixed top-right | Same as auth | Mobile-safe; does not overlap card on 320px widths (`right-4 top-4`). |
| **FW-STORE header** | Right cluster, **before** cart icon | `… nav … ModeToggle · Cart · Account` | Only on FW-STORE routes. |
| **Auth inside store slug** | Fixed top-right on FW-AUTH canvas | **Not** duplicated in store header (user is on auth canvas without `StoreShell`) | Resolves PRD open Q5. |
| **ui-spec showcase** | Page title row right | Existing `page.tsx` L177–179 | Reference implementation. |

**Keyboard:** ModeToggle trigger is tabbable; menu items activate on Enter. Focus ring via `outline-ring/50` token.

**Motion:** Icon rotate/scale transitions in `ModeToggle` disabled when `prefers-reduced-motion: reduce`. Sidebar width transition disabled likewise.

---

## Light / dark token usage

Source of truth: `apps/ui-spec/src/app/globals.css`. Portals import equivalent tokens via `packages/ui/styles/globals.css` (must stay in sync).

### Semantic tokens (use Tailwind classes, not raw oklch)

| Token | Tailwind | Light usage | Dark usage |
|-------|----------|-------------|------------|
| `--background` | `bg-background` | Page canvas | Page canvas |
| `--foreground` | `text-foreground` | Body text | Body text |
| `--card` | `bg-card` | Cards, table surface | Cards |
| `--muted` | `bg-muted` | Auth canvas, skeleton bg | Auth canvas |
| `--muted-foreground` | `text-muted-foreground` | Meta, table headers | Meta |
| `--primary` | `bg-primary`, `text-primary` | CTAs, active nav | CTAs |
| `--border` | `border-border` | Table, card borders | Borders |
| `--destructive` | `text-destructive`, `bg-destructive` | Errors, reject | Errors |
| `--sidebar` | `bg-sidebar` | ERP sidebar bg | Sidebar bg |
| `--sidebar-accent` | `bg-sidebar-accent` | Active nav item (sidebar-03) | Active nav |

### Status colors (not CSS variables — utility classes)

| Status | Classes |
|--------|---------|
| Success | `text-emerald-600 dark:text-emerald-400` |
| Warning | `text-amber-600 dark:text-amber-400` |
| Error | `text-destructive`, `Badge variant="destructive"` |

### Typography (framework chrome)

| Role | Classes |
|------|---------|
| Page title | `text-2xl font-semibold tracking-tight` |
| Section / card title | `text-base font-medium` |
| Body | `text-sm` |
| Table header | `text-xs font-medium uppercase tracking-wide text-muted-foreground` |

### Radius & density

| Element | Class |
|---------|-------|
| Inputs | `rounded-md` (`--radius-md`) |
| Cards | `rounded-xl` (`--radius-xl`) |
| Buttons | `rounded-full` (pill — design-system) |
| Page padding | `p-4 md:p-6` |
| Section gap | `space-y-6` |

---

## Icon libraries

| Layer | Library | Usage |
|-------|---------|-------|
| ui-spec showcase | `lucide-react` | Primitives, `ModeToggle`, sidebar trigger |
| Portal shells | `@tabler/icons-react` stroke 1.5 | Nav items only (existing convention) |

**Mapping:** Each Tabler nav icon has a Lucide equivalent in ui-spec sidebar demo for documentation; portals keep Tabler in production shells.

---

## Per-portal route tables

### `apps/admin` (8 routes)

| Route | Framework(s) | shadcn / ui-spec reference | Key components |
|-------|--------------|----------------------------|--------------|
| `/login` | FW-AUTH | login-03 · **Framework: Auth** | `AuthLayout`, `Form`, `Input`, `Button`, `ModeToggle` fixed |
| `/` | FW-SHELL-ERP + FW-DASHBOARD | dashboard-01 · **Framework: ERP Shell** + **Dashboard** | `SidebarProvider`, `MetricCard`, `PageHeader` |
| `/merchants` | FW-SHELL-ERP + FW-LIST | dashboard-01 table · **List Page** | `PageHeader`, `Table`, `Badge`, `EmptyState`, `Skeleton` |
| `/merchants/[id]` | FW-SHELL-ERP + FW-DETAIL | dashboard-01 cards · **Detail Page** | `Breadcrumb`, `Card`, `Tabs`, `Badge`, `Dialog` |
| `/orders` | FW-SHELL-ERP + FW-LIST | **List Page** | Same as merchants list |
| `/settlements` | FW-SHELL-ERP + FW-LIST | **List Page** | Same as merchants list |
| `/settings` | FW-SHELL-ERP + FW-SETTINGS | **Settings** | `Card`, `Separator`, `Switch` |
| `/inventory/tenants/[tenantId]` | FW-SHELL-ERP + FW-DETAIL | **Detail Page** + table | `Card`, `Table` (stock) |

### `apps/merchant` (25 routes)

| Route | Framework(s) | shadcn / ui-spec reference | Key components |
|-------|--------------|----------------------------|--------------|
| `/login` | FW-AUTH | login-03 · **Auth** | `AuthLayout`, `ModeToggle` |
| `/register` | FW-AUTH | login-03 · **Auth** | Stable outer frame; wizard in `CardContent` |
| `/onboarding/pending` | FW-AUTH-STATUS | **Auth Status** | `Badge`, `Alert`, `Card` |
| `/bind/[token]` | FW-BIND | **Bind Card** | `Card`, `Button min-h-11`, `Skeleton`, `ModeToggle` |
| `/` | FW-SHELL-ERP + FW-DASHBOARD | **ERP Shell** + **Dashboard** | `MetricCard` grid |
| `/settings` | FW-SHELL-ERP + FW-SETTINGS | **Settings** | `Card`, `Switch` |
| `/crm/contacts` | FW-SHELL-ERP + FW-LIST | **List Page** | `Table`, `Sheet` (quick add) |
| `/crm/companies` | FW-SHELL-ERP + FW-LIST | **List Page** | Same |
| `/crm/leads` | FW-SHELL-ERP + FW-LIST | **List Page** | `Badge` stage |
| `/crm/activities` | FW-SHELL-ERP + FW-LIST | **List Page** | Same |
| `/crm/contacts/[id]` * | FW-SHELL-ERP + FW-DETAIL | **Detail Page** | `Tabs`, timeline `Card` |
| `/crm/leads/[id]` * | FW-SHELL-ERP + FW-DETAIL | **Detail Page** | Stage `Badge` |
| `/catalog/products` | FW-SHELL-ERP + FW-LIST | **List Page** | Same |
| `/catalog/categories` | FW-SHELL-ERP + FW-LIST | **List Page** | Same |
| `/distributors` | FW-SHELL-ERP + FW-LIST | **List Page** | Same |
| `/distributors/[id]` | FW-SHELL-ERP + FW-DETAIL | **Detail Page** | `Card`, commission fields |
| `/orders` | FW-SHELL-ERP + FW-LIST | **List Page** | Same |
| `/orders/[id]` | FW-SHELL-ERP + FW-DETAIL | **Detail Page** | `Table` line items |
| `/inventory/warehouses` | FW-SHELL-ERP + FW-LIST | **List Page** | Same |
| `/inventory/stock` | FW-SHELL-ERP + FW-LIST | **List Page** | Same |
| `/inventory/adjustments` | FW-SHELL-ERP + FW-FORM + FW-LIST | **Form** + **List** | Form `Card` above `Table` |
| `/inventory/alerts` | FW-SHELL-ERP + FW-LIST | **List Page** | Nav `Badge` count on shell |
| `/inventory/purchase-orders` | FW-SHELL-ERP + FW-LIST | **List Page** | Same |
| `/inventory/purchase-orders/new` | FW-SHELL-ERP + FW-FORM | **Form Page** | `Form`, `Card` |
| `/inventory/purchase-orders/[id]` | FW-SHELL-ERP + FW-DETAIL | **Detail Page** | Lines `Table` |
| `/inventory/reports` | FW-SHELL-ERP + FW-DASHBOARD | **Dashboard** + **List** | Metrics + `Table` |
| `/inventory/settings` | FW-SHELL-ERP + FW-SETTINGS | **Settings** | Same as `/settings` |

\* Gap-closure routes — frameworks apply when Workstream B ships.

### `apps/store` (9 routes)

| Route | Framework(s) | shadcn / ui-spec reference | Key components |
|-------|--------------|----------------------------|--------------|
| `/` | FW-AUTH-STATUS | **Auth Status** | Minimal `Card`, `ModeToggle` |
| `/s/[slug]` | FW-STORE | **Store Shell** | Header, product `Card` grid |
| `/s/[slug]/products/[productSlug]` | FW-STORE + FW-DETAIL | **Store Shell** + **Detail** | PDP `Card`, consumer spacing |
| `/s/[slug]/cart` | FW-STORE + FW-LIST | **Store Shell** + **List** | Line `Table` / list |
| `/s/[slug]/checkout` | FW-STORE + FW-FORM | **Store Shell** + **Form** | `min-h-11` CTAs |
| `/s/[slug]/account` | FW-STORE + FW-DETAIL | **Store Shell** + **Detail** | Section `Card`s |
| `/s/[slug]/login` | FW-AUTH | **Auth** | Store name as subtitle |
| `/s/[slug]/register` | FW-AUTH | **Auth** | Same |
| `/s/[slug]/bind/[token]` | FW-BIND | **Bind Card** | Same as merchant bind |

---

## New ui-spec showcase sections

Add to `apps/ui-spec/src/app/page.tsx` as full-width **framework** sections (below primitive grid or new `Frameworks` anchor). Each section must render in light/dark via existing `ThemeProvider` + page-level `ModeToggle`.

| Priority | Section ID | Framework | Builds from existing showcase |
|----------|------------|-----------|-------------------------------|
| **P0 — 1** | `framework-erp-shell` | FW-SHELL-ERP | `sidebar.tsx` + inset header with `ModeToggle` |
| **P0 — 2** | `framework-list-page` | FW-LIST | Data Table + Form Controls filters + Skeleton + EmptyState |
| **P0 — 3** | `framework-auth` | FW-AUTH | Form Controls + Card + fixed `ModeToggle` |
| **P0 — 4** | `framework-detail-page` | FW-DETAIL | Tabs + Breadcrumb + Data Table |
| **P1 — 5** | `framework-dashboard` | FW-DASHBOARD | Card + MetricCard grid |
| **P1 — 6** | `framework-form-page` | FW-FORM | Form Controls in Card |
| **P1 — 7** | `framework-settings` | FW-SETTINGS | Card + Switch + Separator |
| **P1 — 8** | `framework-store-shell` | FW-STORE | New header mock + `ModeToggle` |
| **P1 — 9** | `framework-bind-card` | FW-BIND | Card + Alert + Skeleton |
| **P2 — 10** | `framework-auth-status` | FW-AUTH-STATUS | Alert + Badge on muted canvas |

**Already exists:** Primitive sections (Buttons, Data Table, Form Controls, Feedback & Progress, Tabs, Dialogs). **ModeToggle** at page header (reference only — frameworks duplicate placement rules).

### ui-spec implementation notes

1. Add `id` anchors per section for design-doc deep links (`#framework-list-page`).
2. Framework sections use `min-h` preview containers; ERP shell section should be `h-[600px]` bordered preview.
3. Propagate each framework to `packages/ui` only after its showcase section merges.
4. Run `rtk pnpm --filter @meridian/ui-spec dev` to verify light/dark before portal rollout.

---

## Page states (all frameworks)

| State | Pattern | ui-spec source |
|-------|---------|----------------|
| Loading | `Skeleton` rows / cards | Feedback & Progress |
| Empty | `EmptyState` with icon + CTA | packages/ui `EmptyState` (add to showcase in List section) |
| Error | `Alert variant="destructive"` | Feedback & Progress |
| Success feedback | `sonner` toast | Toast Notifications |

---

## Accessibility

- WCAG 2.1 AA contrast on `bg-background` / `bg-card` / `bg-muted` pairs in both themes.
- Visible focus rings (`outline-ring/50` from globals).
- Table headers: `<TableHead scope="col">`.
- Status: `Badge` text + color (not color alone).
- Bind / store checkout buttons: `min-h-11` (44px).
- Sidebar mobile sheet: focus trap (shadcn `Sheet`).
- `ModeToggle`: `sr-only` label on trigger.

---

## Non-goals (design)

- Figma deliverables
- Per-tenant theme overrides
- New chart/analytics widgets beyond placeholder
- login-04 split-panel auth
- Marketing-style store landing redesign

---

## Resolved design decisions

| PRD question | Decision |
|--------------|----------|
| Q3 sidebar-03 vs sidebar-07 | **sidebar-03** canonical |
| Q5 Store theme toggle duplication | **FW-STORE header** on catalog/cart/account/checkout; **fixed top-right** on FW-AUTH and FW-BIND (no header duplication) |
| Q9 Icon libraries | Tabler in portal nav; Lucide in ui-spec and `ModeToggle` |

## Open questions (for architect)

| # | Question |
|---|----------|
| 1 | `ThemeProvider` in each app vs shared `packages/ui` wrapper |
| 2 | Theme storage: localStorage vs cookie for SSR |
| 4 | Named layout components (`ListPage`) vs composition docs only |
| 6 | `StoreShell` upgrade in place vs V2 flag |
| 7 | CRM detail routes: framework now vs Workstream B |
| 8 | Rollout sequencing per portal vs big-bang |

---

## Related files

| Path | Role |
|------|------|
| `apps/ui-spec/src/app/page.tsx` | Showcase (extend with framework sections) |
| `apps/ui-spec/src/app/globals.css` | Tokens |
| `apps/ui-spec/src/components/mode-toggle.tsx` | Theme control reference |
| `apps/ui-spec/src/components/ui/sidebar.tsx` | sidebar-03 primitives |
| `packages/ui/src/components/shells/*` | Shells to migrate |
| `packages/ui/src/components/auth-layout.tsx` | FW-AUTH base |
| `packages/ui/src/components/page-header.tsx` | FW-LIST/DETAIL/FORM chrome |
| `docs/design/design-system.md` | Density and typography |
