# Platform shadcn Blocks Framework — Architecture

**Version:** 1.0  
**Last updated:** 2025-06-25  
**PRD:** [platform-shadcn-blocks-framework.md](../prd/platform-shadcn-blocks-framework.md)  
**Supersedes:** Workstream A of [platform-ui-blocks-and-gaps.md](./platform-ui-blocks-and-gaps.md) (shell + page-framework scope only)

## Overview

UI-only initiative: introduce a **three-layer component stack** (ui-spec → `packages/ui` → portal apps), wire **light/dark/system** theming on every route, and replace ad-hoc page layouts with **named framework composites** mapped to shadcn blocks (dashboard-01, sidebar-03, login-03).

**No new API endpoints, Prisma models, BullMQ jobs, or Redis cache keys.** No `packages/shared` contract changes unless a future portal needs typed nav config (out of scope).

### Key decisions (summary)

| Topic | Decision |
|-------|----------|
| ThemeProvider | Shared wrapper in `@meridian/ui`; each portal mounts it in root `layout.tsx` |
| Theme persistence | `next-themes` **localStorage** via per-portal `storageKey`; no SSR theme cookie in P0 |
| ERP sidebar primitive | **sidebar-03** (`SidebarMenuSub`) — canonical for admin + merchant |
| Shell base | New `ErpShell` on `SidebarProvider` stack; deprecate `ShellFrame` after migration |
| Page frameworks | **Named components** in `packages/ui` (not composition-only docs) |
| Store shell | **In-place** upgrade `StoreShell` → `StoreShellFrame` (no V2 flag) |
| Icons | `@tabler/icons-react` in portal nav configs; `lucide-react` in `ModeToggle` / sidebar chrome (mirrors ui-spec) |
| CRM detail routes | Apply `DetailPageFrame` when Workstream B ships those routes; frameworks land in this initiative |
| Rollout | ui-spec showcase → `packages/ui` → portals **route-by-route** (not big-bang) |

---

## Component layering

```
┌─────────────────────────────────────────────────────────────┐
│ packages/ui           Source of truth + shared components     │
│  src/app/page.tsx     Framework sections per FW-* ID        │
│  src/components/ui/   Primitives (sidebar, card, table…)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ copy / mirror APIs (no drift)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ packages/ui (@meridian/ui)  Published composites + primitives│
│  components/ui/           sidebar, dropdown-menu, separator… │
│  components/theme/        ThemeProvider, ModeToggle           │
│  components/frameworks/   ErpShell, *PageFrame, BindPageFrame │
│  components/shells/       AdminShell, MerchantShell (nav cfg)│
└──────────────────────────────┬──────────────────────────────┘
                               │ import composites; pages supply data
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Portal apps (admin | merchant | store)                       │
│  app/layout.tsx           ThemeProvider root wiring          │
│  app/**/page.tsx          Feature UI inside *PageFrame       │
│  components/              App-local tables, forms, fetchers  │
└─────────────────────────────────────────────────────────────┘
```

### Layer rules

1. **packages/ui first** — Any primitive or framework pattern missing from `packages/ui` is added there before portal adoption (`.cursor/rules/ui.mdc`).
2. **Single consumption path** — Portals import from `@meridian/ui` only; they never import `apps/ui-spec`.
3. **Feature logic stays in apps** — Data fetching, mutations, Zod forms, and route params remain in portal `app/` and `components/`; frameworks own **chrome only** (spacing, headers, cards, loading/empty slots).
4. **Propagate primitives** — When ui-spec adds or changes a primitive API, update the matching file under `packages/ui/src/components/ui/` in the same PR series.

---

## Theme system

### Shared `ThemeProvider` (`packages/ui`)

Add a thin client wrapper mirroring ui-spec:

| File | Purpose |
|------|---------|
| `packages/ui/src/components/theme/theme-provider.tsx` | Re-export `next-themes` `ThemeProvider` |
| `packages/ui/src/components/theme/mode-toggle.tsx` | Light / Dark / System dropdown (from ui-spec) |
| `packages/ui/src/components/theme/index.ts` | Barrel export |

**Default props** (fixed in wrapper; portals may override `storageKey` only):

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
  storageKey="meridian-theme" // overridden per portal — see below
>
```

### Per-portal root layout wiring

Each portal `app/layout.tsx` becomes:

```tsx
<html lang="en" suppressHydrationWarning>
  <body className="min-h-screen bg-background font-sans antialiased">
    <ThemeProvider storageKey="meridian-theme-admin"> {/* or -merchant / -store */}
      {children}
    </ThemeProvider>
  </body>
</html>
```

| App | `storageKey` | Notes |
|-----|--------------|-------|
| `apps/admin` | `meridian-theme-admin` | Isolated preference per portal |
| `apps/merchant` | `meridian-theme-merchant` | |
| `apps/store` | `meridian-theme-store` | Per-browser; not per-tenant slug |

**`suppressHydrationWarning` on `<html>`** — Required by `next-themes` to avoid hydration mismatch when client resolves system theme.

### SSR / persistence strategy

| Approach | Verdict | Rationale |
|----------|---------|-----------|
| Cookie-backed theme for SSR paint | **Defer (P2)** | Adds middleware/layout cookie plumbing; marginal gain because ERP pages are client-hydrated and auth shells tolerate brief system-theme flash |
| **localStorage via `next-themes`** | **P0** | Default library behavior; satisfies US-T1 session persistence across in-portal navigation |
| Sidebar open state cookie | **Use shadcn default** | ui-spec `sidebar.tsx` already sets `sidebar_state` cookie client-side — copy unchanged to `packages/ui` |

**FOUC mitigation (P0):** `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`, and `suppressHydrationWarning`. No inline blocking script required.

**Accessibility (US-T2):** `packages/ui/styles/globals.css` already honors `prefers-reduced-motion`; ensure copied sidebar does not add motion-only transitions outside that media query.

### ModeToggle placement

| Surface | Placement |
|---------|-----------|
| ERP shell header (`ErpShell`) | Right cluster: `ModeToggle` before user email / sign out |
| Auth (`AuthLayout`) | Top-right of viewport (`absolute` in layout) or footer slot — **both auth and shell** get toggle (no duplication on same view) |
| Store (`StoreShellFrame`) | Header right cluster beside cart / account |
| Bind (`BindPageFrame`) | Top-right of `min-h-svh` canvas |

---

## Shell upgrade: `ShellFrame` → `ErpShell`

### Current state

`ShellFrame` (`packages/ui/src/components/shells/shell-frame.tsx`) implements a **manual** dashboard-01 skeleton: fixed `<aside>`, custom mobile `Sheet`, no `SidebarProvider`, no collapse, no cookie persistence.

`AdminShell` / `MerchantShell` pass flat or hand-rolled nested nav into `ShellFrame`.

### Target state: `ErpShell`

New composite at `packages/ui/src/components/frameworks/erp-shell.tsx`:

```
SidebarProvider
├── Sidebar (collapsible="icon", variant per dashboard-01)
│   ├── SidebarHeader      — portal brand / business name
│   ├── SidebarContent
│   │   └── SidebarGroup
│   │       └── SidebarMenu (+ SidebarMenuSub for nested items — sidebar-03)
│   └── SidebarFooter      — optional (settings link)
└── SidebarInset
    ├── header (h-12 border-b)
    │   ├── SidebarTrigger
    │   ├── headerStart slot  — breadcrumb / page context (optional)
    │   └── headerEnd slot    — ModeToggle, userEmail, onLogout, tenant placeholder
    └── main (flex-1 overflow-auto p-4 md:p-6)
        └── {children}
```

**Reference:** shadcn [dashboard-01 Featured](https://ui.shadcn.com/blocks/dashboard#dashboard-01) + [sidebar-03](https://ui.shadcn.com/blocks/sidebar#sidebar-03).

### sidebar-03 vs sidebar-07

| Option | Verdict |
|--------|---------|
| **sidebar-03** (`SidebarMenuSub`, collapsible groups) | **Canonical** — matches merchant CRM / Catalog / Inventory submenu model; aligns with existing `MerchantShell` section keys |
| sidebar-07 (alternate collapsible) | Reject unless sidebar-03 submenu UX fails QA on mobile |

**Admin** uses flat `SidebarMenu` items (no submenus). **Merchant** uses `SidebarMenuSub` for `crm`, `catalog`, `inventory` groups with auto-expand when `pathname` matches section prefix (preserve current `sectionPrefix` logic).

### Primitives to copy from ui-spec → `packages/ui`

| Source | Target |
|--------|--------|
| `apps/ui-spec/src/components/ui/sidebar.tsx` | `packages/ui/src/components/ui/sidebar.tsx` |
| `apps/ui-spec/src/hooks/use-mobile.ts` | `packages/ui/src/hooks/use-mobile.ts` |
| `apps/ui-spec/src/components/ui/separator.tsx` | `packages/ui/src/components/ui/separator.tsx` |
| `apps/ui-spec/src/components/ui/tooltip.tsx` | `packages/ui/src/components/ui/tooltip.tsx` |
| `apps/ui-spec/src/components/ui/dropdown-menu.tsx` | `packages/ui/src/components/ui/dropdown-menu.tsx` |
| `apps/ui-spec/src/components/ui/skeleton.tsx` | Extend existing dialog-adjacent skeleton or dedicated file |

**Dependencies to add** (`packages/ui/package.json`):

- `next-themes` (dependency)
- `lucide-react` (dependency — ModeToggle + SidebarTrigger icon)
- `@base-ui/react` (if sidebar copy requires it — match ui-spec)
- `class-variance-authority` (sidebar variants)

**CSS:** Merge sidebar token block from `apps/ui-spec/src/app/globals.css` (`--sidebar`, `--sidebar-foreground`, …) into `packages/ui/styles/globals.css`; portal apps already `@import` or duplicate this file.

### Portal shell wrappers

| Component | Change |
|-----------|--------|
| `AdminShell` | Render `ErpShell` with flat `navItems` config; keep tenant switcher placeholder in `headerEnd` |
| `MerchantShell` | Render `ErpShell` with nested `navItems` + `lowStockAlertCount` badge on alerts child |
| `ShellFrame` | Mark `@deprecated`; remove after all shells migrated |

---

## Framework composites (`packages/ui`)

All live under `packages/ui/src/components/frameworks/`. Export from `packages/ui/src/index.ts`.

### Taxonomy → component map

| Framework ID | Component | shadcn / ui-spec anchor |
|--------------|-----------|-------------------------|
| FW-SHELL-ERP | `ErpShell` (+ `AdminShell` / `MerchantShell`) | dashboard-01 + sidebar-03 |
| FW-AUTH | `AuthLayout` (enhanced) | login-03 |
| FW-AUTH-STATUS | `AuthStatusFrame` | login-03 canvas without form card |
| FW-DASHBOARD | `DashboardFrame` | dashboard-01 metric row |
| FW-LIST | `ListPageFrame` | dashboard-01 table section |
| FW-DETAIL | `DetailPageFrame` | dashboard-01 cards + embedded table |
| FW-FORM | `FormPageFrame` | Card-contained form |
| FW-SETTINGS | `SettingsPageFrame` | settings Card stack |
| FW-STORE | `StoreShellFrame` | consumer header (replaces `StoreShell` body) |
| FW-BIND | `BindPageFrame` | centered status Card |

### Component contracts

#### `ListPageFrame`

```typescript
export interface ListPageFrameProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Optional filter / search row below PageHeader */
  filters?: React.ReactNode;
  children: React.ReactNode; // Table or DataTable
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}
```

Structure: `PageHeader` → optional filters → `children` in `rounded-md border` container with sticky `TableHeader` (consumer supplies table). When `isLoading`, render `Skeleton` rows; when empty, render `emptyState` or default `EmptyState`.

#### `DetailPageFrame`

```typescript
export interface DetailPageFrameProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode; // Card grid, Tabs, embedded tables
  className?: string;
}
```

Structure: back link / `Breadcrumb` row → `PageHeader` with `badges` + `actions` → `div.space-y-4` for card sections.

#### `FormPageFrame`

```typescript
export interface FormPageFrameProps {
  title: string;
  description?: string;
  children: React.ReactNode; // Form fields inside Card
  footer?: React.ReactNode; // Primary / secondary actions
  className?: string;
}
```

Structure: `PageHeader` → `Card` wrapping form → sticky or inline `footer` action row.

#### `SettingsPageFrame`

```typescript
export interface SettingsPageFrameProps {
  title: string;
  description?: string;
  children: React.ReactNode; // Stacked setting Cards
  className?: string;
}
```

Structure: `PageHeader` → `div.space-y-6` of `Card` sections with `Separator` between logical groups (children compose sections).

#### `DashboardFrame`

```typescript
export interface DashboardFrameProps {
  title: string;
  description?: string;
  metrics?: React.ReactNode; // MetricCard grid
  children?: React.ReactNode; // Optional chart row / table below
  className?: string;
}
```

#### `StoreShellFrame`

In-place replacement for `StoreShell` (`packages/ui/src/components/shells/store-shell.tsx`):

- Same props: `storeSlug`, `storeName`, `cartCount`, `userEmail`, `onLogout`
- Add `ModeToggle` in header right cluster
- Preserve 44px touch targets on cart / account icons
- `main` slot unchanged (`max-w-6xl`)

Rename export path: keep `StoreShell` as alias to `StoreShellFrame` for one release cycle, then deprecate old name.

#### `BindPageFrame`

```typescript
export interface BindPageFrameProps {
  title: string;
  description?: string;
  children: React.ReactNode; // Status, form, or CTA inside centered Card
  footer?: React.ReactNode;
  className?: string;
}
```

Structure: `min-h-svh bg-muted` → top-right `ModeToggle` → centered `Card.max-w-sm` → primary CTA min-h-11 (44px).

#### `AuthStatusFrame`

```typescript
export interface AuthStatusFrameProps {
  subtitle: string;
  children: React.ReactNode; // Status Card content (Badge, Alert)
  footer?: React.ReactNode;
}
```

Muted viewport like `AuthLayout` but **no** form Card wrapper around brand — single status `Card` for content (onboarding pending, store landing).

#### `AuthLayout` (enhancement)

Extend existing component:

```typescript
export interface AuthLayoutProps {
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** When true, renders ModeToggle in top-right. Default true when ThemeProvider ancestor exists. */
  showThemeToggle?: boolean;
  className?: string;
}
```

---

## Module boundaries (Next.js)

| App | Folders touched | Responsibility |
|-----|-----------------|----------------|
| `apps/admin` | `app/layout.tsx`, `app/login/`, `app/(shell)/**` | Wire theme; wrap list/detail/settings routes in frames |
| `apps/merchant` | `app/layout.tsx`, auth routes, `app/(authenticated)/**` | Same; nested nav config stays in `MerchantShell` |
| `apps/store` | `app/layout.tsx`, `app/s/[slug]/**`, `components/store-shell-wrapper.tsx` | `StoreShellFrame`; auth/bind/checkout frames |
| `packages/ui` | shared framework components and exports | Provide every FW-* before portal merge |
| `packages/ui` | `components/frameworks/`, `components/theme/`, `components/ui/sidebar.tsx` | Shared composites and primitives |

**NestJS (`apps/api`):** No changes.

---

## API contracts

**None.** This initiative does not add or modify REST endpoints. Existing page data fetching patterns (Server Components + cookie-forwarded fetch) are unchanged.

---

## Data model

**None.**

---

## Async jobs

**None.**

---

## Caching

**None** (UI-only). Client-side only:

- Theme: `localStorage` keys per portal (`storageKey`)
- Sidebar expanded/collapsed: `sidebar_state` cookie (client-written by `SidebarProvider`)

---

## Migration strategy

### Phase 0 — ui-spec showcase (gate for all portal work)

Add shared framework components and examples to `packages/ui`:

| Section | Demonstrates |
|---------|--------------|
| ERP Shell | `SidebarProvider` + sidebar-03 submenus + `SidebarInset` + header with `ModeToggle` |
| Dashboard | `DashboardFrame` + `MetricCard` grid |
| List | `ListPageFrame` + sticky table + `EmptyState` + `Skeleton` |
| Detail | `DetailPageFrame` + multi-card + embedded table |
| Form | `FormPageFrame` + validation messages |
| Settings | `SettingsPageFrame` + `Switch` sections |
| Store header | `StoreShellFrame` mock |
| Bind | `BindPageFrame` |
| Auth | `AuthLayout` + `AuthStatusFrame` |

Update `docs/design/platform-shadcn-blocks-framework.md` (ui-designer deliverable) with ui-spec anchor links.

### Phase 1 — `packages/ui` foundation

1. Copy sidebar + theme primitives; extend `globals.css` tokens  
2. Implement `ThemeProvider`, `ModeToggle` exports  
3. Implement `ErpShell`; refactor `AdminShell` / `MerchantShell`  
4. Implement all `*PageFrame` components  
5. Upgrade `StoreShell` → `StoreShellFrame`; add `BindPageFrame`, `AuthStatusFrame`, `DashboardFrame`  
6. Deprecate `ShellFrame`

### Phase 2 — Portal theme wiring (parallel across apps)

Wire `ThemeProvider` in all three `app/layout.tsx` files. Add `ModeToggle` to shells and auth — **smallest vertical slice, unblocks dark-mode QA**.

### Phase 3 — Portal route migration (route-by-route)

Migrate **within each portal** in this order (reduces conflict surface):

1. **Auth routes** — `/login`, `/register`, onboarding, store auth  
2. **Shell swap** — authenticated layout groups use new `AdminShell` / `MerchantShell` / `StoreShellFrame`  
3. **List routes** — highest route count; establish `ListPageFrame` pattern  
4. **Detail routes**  
5. **Form routes** — PO new, adjustments, checkout  
6. **Settings + dashboard** — P1 stories  

**Per-route checklist:**

- [ ] Page uses correct `*PageFrame` (or auth/shell composite)  
- [ ] No duplicated `PageHeader` / outer padding from old layout  
- [ ] Light + dark smoke pass  
- [ ] Existing Playwright spec still passes (update selectors only if chrome changed)

### Portal sequencing (recommended)

| Order | Portal | Rationale |
|-------|--------|-----------|
| 1 | `admin` (8 routes) | Smallest; validates ERP shell on flat nav |
| 2 | `merchant` (25 routes) | Exercises sidebar-03 submenus at scale |
| 3 | `store` (9 routes) | Consumer shell separate from ERP path |

**Not big-bang:** merge framework PRs incrementally per route group (e.g. `feat/framework-admin-lists`).

### Coordination with `platform-ui-blocks-and-gaps`

| Workstream | Relationship |
|------------|--------------|
| **This PRD (framework)** | Supersedes gap-doc **Workstream A** shell/framework scope |
| **Gap Workstream B** (checkout slug, guest cart, CRM detail routes) | Implement **on top of** frames when merging; CRM detail routes use `DetailPageFrame` at route creation time |
| Parallel branches | Prefer **framework branch base** for new UI pages; rebase gap-closure UI onto framework composites |

---

## ADRs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ThemeProvider location | Shared wrapper in `packages/ui`; mount in each app `layout.tsx` | Single default props; portals only set `storageKey`; avoids three divergent copies |
| Theme SSR storage | localStorage only (P0) | `next-themes` default; meets session persistence; cookie SSR deferred |
| ERP sidebar block | sidebar-03 | Native submenu support for merchant; admin uses flat menu in same primitive |
| Page framework API | Named `*PageFrame` components | Enforces consistent chrome; satisfies US-F0; lowers copy-paste vs docs-only recipes |
| Store shell migration | In-place `StoreShellFrame` | UI-only refactor; no feature flag overhead |
| `ShellFrame` fate | Deprecate then delete | Prevents two shell implementations |
| Icon libraries | Tabler in nav config; Lucide in shared chrome | Respects design-system shell rule + ui-spec ModeToggle/source |
| CRM detail timing | Framework ready now; routes when Workstream B ships | Avoid blocking framework on CRM API gaps |
| Implementation order | ui-spec → packages/ui → portals route-by-route | ui-spec rule; smallest reviewable PRs |
| API / shared package | No changes | Pure presentation layer |

---

## File path reference

### New / modified in `packages/ui`

```
packages/ui/
├── package.json                          # + next-themes, lucide-react, cva, @base-ui/react
├── styles/globals.css                    # + sidebar CSS variables
├── src/
│   ├── index.ts                          # export frameworks + theme
│   ├── hooks/use-mobile.ts
│   └── components/
│       ├── theme/
│       │   ├── theme-provider.tsx
│       │   └── mode-toggle.tsx
│       ├── ui/
│       │   ├── sidebar.tsx
│       │   ├── separator.tsx
│       │   ├── tooltip.tsx
│       │   ├── dropdown-menu.tsx
│       │   └── skeleton.tsx
│       ├── frameworks/
│       │   ├── erp-shell.tsx
│       │   ├── dashboard-frame.tsx
│       │   ├── list-page-frame.tsx
│       │   ├── detail-page-frame.tsx
│       │   ├── form-page-frame.tsx
│       │   ├── settings-page-frame.tsx
│       │   ├── store-shell-frame.tsx
│       │   ├── bind-page-frame.tsx
│       │   └── auth-status-frame.tsx
│       ├── auth-layout.tsx               # + showThemeToggle
│       └── shells/
│           ├── admin-shell.tsx           # uses ErpShell
│           ├── merchant-shell.tsx        # uses ErpShell + submenus
│           ├── store-shell.tsx           # re-exports StoreShellFrame
│           └── shell-frame.tsx           # @deprecated
```

### Portal touch points

```
apps/admin/app/layout.tsx
apps/merchant/app/layout.tsx
apps/store/app/layout.tsx
apps/*/app/globals.css                    # ensure sidebar tokens if not importing ui globals
```

### ui-spec

```
packages/ui/src/index.ts                    # framework exports
packages/ui/src/components/theme/           # theme provider wiring
```

---

## Testing expectations

| Layer | Verification |
|-------|--------------|
| ui-spec | Visual review of all FW-* sections in light/dark/system |
| `packages/ui` | `tsc --noEmit`; Storybook optional (not required) |
| Portals | Existing Playwright e2e green; add smoke: theme toggle + sidebar collapse on one route per portal |
| Accessibility | Keyboard path to `ModeToggle`; WCAG AA contrast on form/table in both themes |

---

## Open questions (resolved)

| # | Question | Resolution |
|---|----------|------------|
| 1 | ThemeProvider in app vs `packages/ui` | **Both** — wrapper in `packages/ui`, mount in each `layout.tsx` |
| 2 | localStorage vs cookie | **localStorage** P0; cookie SSR P2 if FOUC reported |
| 3 | sidebar-03 vs sidebar-07 | **sidebar-03** |
| 4 | Named components vs recipes | **Named `*PageFrame` components** |
| 5 | Store theme toggle placement | Header on FW-STORE; auth pages use `AuthLayout` toggle (ui-designer may refine visual) |
| 6 | StoreShell upgrade | **In-place** `StoreShellFrame` |
| 7 | CRM detail sequencing | Framework now; routes with Workstream B |
| 8 | Rollout order | **ui-spec → packages/ui → portals route-by-route** |
| 9 | Icon mapping | Tabler nav / Lucide chrome — document in design spec |
| 10 | gap-closure PR relationship | Framework supersedes WS-A; rebase WS-B UI onto frames |

---

## Related documents

| Document | Path |
|----------|------|
| PRD | `docs/prd/platform-shadcn-blocks-framework.md` |
| Gap-closure PRD | `docs/prd/platform-ui-blocks-and-gaps.md` |
| Prior shell architecture | `docs/architecture/platform-ui-blocks-and-gaps.md` |
| Design system | `docs/design/design-system.md` |
| UI spec rules | `.cursor/rules/ui.mdc` |
