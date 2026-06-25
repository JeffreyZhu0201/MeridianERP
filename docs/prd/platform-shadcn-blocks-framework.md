# Platform shadcn Blocks Framework

**Version:** 1.0  
**Last updated:** 2025-06-25  
**Status:** Discovery complete — ready for architecture  
**Supersedes (framework scope):** [platform-ui-blocks-and-gaps.md](./platform-ui-blocks-and-gaps.md) Workstream A  
**Related:** [platform-ui-blocks-and-gaps.md](./platform-ui-blocks-and-gaps.md) (gap closure Workstream B), [design-system.md](../design/design-system.md), `.cursor/rules/ui-spec.mdc`

## Problem

MeridianERP runs three portals (`apps/admin`, `apps/merchant`, `apps/store`) with **42 routed pages** but **no consistent page-framework system**. Shells use a lightweight `ShellFrame` that does not match shadcn [dashboard-01](https://ui.shadcn.com/blocks/dashboard#dashboard-01) Featured or [sidebar-03](https://ui.shadcn.com/blocks/sidebar#sidebar-03) patterns; list, detail, form, and settings pages each invent local layout. Auth uses partial [login-03](https://ui.shadcn.com/blocks/login#login-03) via `AuthLayout`, but **none of the portals wire `ThemeProvider` or `ModeToggle`** even though `apps/ui-spec` already demonstrates light/dark/system theming.

Operators and merchants expect a cohesive ERP product: the same sidebar behavior, page chrome, table density, and theme control on every screen. Store customers expect trustworthy auth and readable catalog flows that respect their theme preference. Without a defined framework layer, every new route risks visual drift and duplicated layout code.

This initiative defines **reusable page frameworks** mapped to shadcn blocks, rolls them out across **all existing routes**, and adds **adjustable light/dark/system theme** to every portal shell and auth surface.

## Users

| Persona | Portal | Framework needs |
|---------|--------|-----------------|
| Platform Super Admin | `apps/admin` | Dashboard shell, dense list/detail tables, settings |
| Platform Ops | `apps/admin` | Same as admin; merchant review detail pages |
| Merchant Owner / Staff | `apps/merchant` | Nested sidebar shell, CRM/catalog/inventory list-detail-form patterns |
| Merchant applicant | `apps/merchant` | Auth + onboarding status on login-03 canvas |
| Distributor (QR bind) | `apps/merchant`, `apps/store` | Mobile-first bind card, 44px touch targets |
| End Customer | `apps/store` | Consumer header shell, auth, checkout form — not ERP sidebar |

---

## Framework taxonomy

Reusable composites live in `packages/ui` (and are showcased in `apps/ui-spec` **before** portal rollout per ui-spec rules).

| Framework ID | shadcn block reference | ui-spec anchor | Use for |
|--------------|------------------------|----------------|---------|
| **FW-SHELL-ERP** | [dashboard-01](https://ui.shadcn.com/blocks/dashboard#dashboard-01) Featured + [sidebar-03](https://ui.shadcn.com/blocks/sidebar#sidebar-03) | `sidebar.tsx`, dashboard layout section (new showcase) | Admin + merchant authenticated pages |
| **FW-AUTH** | [login-03](https://ui.shadcn.com/blocks/login#login-03) | `Card`, `Form`, `Input`, `ModeToggle` | Login, register |
| **FW-AUTH-STATUS** | login-03 canvas (no form card) | `Card`, `Badge`, `Alert` | Onboarding pending, store landing |
| **FW-DASHBOARD** | dashboard-01 metric + chart row | `MetricCard`, `Card` grid (new showcase) | Portal home `/` |
| **FW-LIST** | dashboard-01 data table | `Table`, `Badge`, `PageHeader`, `EmptyState` | Entity lists, reports tables |
| **FW-DETAIL** | dashboard-01 cards + embedded table | `Card`, `Tabs`, `Breadcrumb`, `Table` | Merchant detail, order detail, tenant inventory |
| **FW-FORM** | Card-contained form (blocks forms pattern) | `Form`, `Input`, `Select`, `Textarea` | PO create, inline create dialogs |
| **FW-SETTINGS** | settings-style stacked sections | `Card`, `Separator`, `Switch` (new showcase) | `/settings`, inventory settings |
| **FW-STORE** | Consumer storefront header (non-dashboard) | `StoreShell` + product grid patterns (new showcase) | Catalog, cart, checkout, account |
| **FW-BIND** | login-03 simplified / centered card | `Card`, `Button`, `Skeleton` | QR bind flows |

**sidebar-07** is an acceptable alternate collapsible sidebar reference if sidebar-03 submenus prove awkward; architect chooses one canonical primitive set.

---

## Route inventory and block mapping

### `apps/admin` (8 routes)

| Route | Page type | Framework | shadcn / ui-spec block |
|-------|-----------|-----------|------------------------|
| `/login` | Auth | FW-AUTH | login-03 |
| `/` | Dashboard | FW-SHELL-ERP + FW-DASHBOARD | dashboard-01 |
| `/merchants` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/merchants/[id]` | Detail | FW-SHELL-ERP + FW-DETAIL | dashboard-01 cards + actions |
| `/orders` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/settlements` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/settings` | Settings | FW-SHELL-ERP + FW-SETTINGS | settings sections in Card |
| `/inventory/tenants/[tenantId]` | Detail | FW-SHELL-ERP + FW-DETAIL | dashboard-01 cards + stock table |

### `apps/merchant` (25 routes)

| Route | Page type | Framework | shadcn / ui-spec block |
|-------|-----------|-----------|------------------------|
| `/login` | Auth | FW-AUTH | login-03 |
| `/register` | Auth wizard | FW-AUTH | login-03 (stable outer frame) |
| `/onboarding/pending` | Auth status | FW-AUTH-STATUS | login-03 canvas + status Card |
| `/bind/[token]` | Bind / mobile | FW-BIND | centered Card, min-h-svh |
| `/` | Dashboard | FW-SHELL-ERP + FW-DASHBOARD | dashboard-01 |
| `/settings` | Settings | FW-SHELL-ERP + FW-SETTINGS | settings Card sections |
| `/crm/contacts` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/crm/companies` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/crm/leads` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/crm/activities` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/crm/contacts/[id]` * | Detail | FW-SHELL-ERP + FW-DETAIL | cards + activity timeline (gap-closure route) |
| `/crm/leads/[id]` * | Detail | FW-SHELL-ERP + FW-DETAIL | cards + stage + timeline (gap-closure route) |
| `/catalog/products` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/catalog/categories` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/distributors` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/distributors/[id]` | Detail | FW-SHELL-ERP + FW-DETAIL | dashboard-01 cards |
| `/orders` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/orders/[id]` | Detail | FW-SHELL-ERP + FW-DETAIL | dashboard-01 cards + line-items table |
| `/inventory/warehouses` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/inventory/stock` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/inventory/adjustments` | Form + list | FW-SHELL-ERP + FW-FORM + FW-LIST | form Card above table |
| `/inventory/alerts` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table + nav badge |
| `/inventory/purchase-orders` | List | FW-SHELL-ERP + FW-LIST | dashboard-01 table |
| `/inventory/purchase-orders/new` | Form | FW-SHELL-ERP + FW-FORM | Card form + PageHeader |
| `/inventory/purchase-orders/[id]` | Detail | FW-SHELL-ERP + FW-DETAIL | dashboard-01 cards + lines table |
| `/inventory/reports` | Report / dashboard | FW-SHELL-ERP + FW-DASHBOARD | metric cards + table |
| `/inventory/settings` | Settings | FW-SHELL-ERP + FW-SETTINGS | settings Card sections |

\* Routes planned in [platform-ui-blocks-and-gaps](./platform-ui-blocks-and-gaps.md) Workstream B; frameworks apply when those routes ship.

### `apps/store` (9 routes)

| Route | Page type | Framework | shadcn / ui-spec block |
|-------|-----------|-----------|------------------------|
| `/` | Landing | FW-AUTH-STATUS | minimal Card on muted viewport |
| `/s/[slug]` | Catalog | FW-STORE | consumer header + product grid |
| `/s/[slug]/products/[productSlug]` | Product detail | FW-STORE + FW-DETAIL | PDP Card layout (consumer density) |
| `/s/[slug]/cart` | Cart | FW-STORE + FW-LIST | line-item table / list |
| `/s/[slug]/checkout` | Checkout form | FW-STORE + FW-FORM | Card form, 44px CTAs |
| `/s/[slug]/account` | Account | FW-STORE + FW-DETAIL | Card sections |
| `/s/[slug]/login` | Auth | FW-AUTH | login-03 (store brand) |
| `/s/[slug]/register` | Auth | FW-AUTH | login-03 |
| `/s/[slug]/bind/[token]` | Bind / mobile | FW-BIND | centered Card, 44px CTA |

**Store note:** FW-STORE is **not** FW-SHELL-ERP. Consumer pages get theme toggle in the store header; they do not get an ERP sidebar.

---

## User stories

### Theme (cross-portal)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| **US-T1** | As any portal user, I want to switch between light, dark, and system theme so that the UI matches my environment and preference | **P0** | **Given** `ThemeProvider` wraps each portal root layout with `attribute="class"`, `defaultTheme="system"`, and `enableSystem`, **When** I load any page, **Then** the initial theme resolves from system preference without flash of wrong theme (suppress hydration warning pattern per next-themes). **Given** I am on an auth page (admin/merchant/store login or register) or inside a portal shell, **When** I open the theme control, **Then** I can choose Light, Dark, or System and the entire page updates using CSS variables from `apps/ui-spec` globals. **Given** I select Dark, **When** I navigate to another route in the same portal, **Then** dark mode persists for the session. **Given** form fields, tables, and sidebar in either theme, **When** audited, **Then** text/background contrast meets WCAG 2.1 AA. |
| **US-T2** | As a user who prefers reduced motion, I want theme and shell transitions to respect accessibility settings | P1 | **Given** `prefers-reduced-motion: reduce`, **When** I toggle theme or collapse the ERP sidebar, **Then** decorative transitions are disabled or minimized per design-system rules. |

### Framework library (shared)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| **US-F0** | As a frontend engineer, I want documented page frameworks in `packages/ui` so that new routes compose from blocks instead of one-off layouts | **P0** | **Given** the framework taxonomy in this PRD, **When** I implement a new list page, **Then** I use `PageHeader` + list framework wrapper (or documented equivalent) inside the portal shell without copying layout markup from another route. **Given** `apps/ui-spec`, **When** a framework pattern is missing from the showcase, **Then** the showcase is updated first before portal adoption (ui-spec rule). |
| **US-F-SHELL** | As an ERP portal user (admin or merchant), I want a dashboard-01 / sidebar-03 shell so that navigation is consistent and collapsible | **P0** | **Given** I am authenticated in admin or merchant, **When** any shell-wrapped route loads, **Then** the layout uses `SidebarProvider`, collapsible `Sidebar` (sidebar-03 submenus for merchant groups), `SidebarInset`, and a header with `SidebarTrigger` and **US-T1** theme toggle. **Given** mobile viewport, **When** I open navigation, **Then** sidebar appears in a sheet with focus trap. **Given** nested nav (CRM, Catalog, Inventory), **When** my route is under that section, **Then** the group is expanded and the active item highlighted. |

### Admin frameworks (`apps/admin`)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| **US-F-ADM-AUTH** | As a platform admin, I want login on the login-03 framework with theme toggle | **P0** | **Given** `/login`, **When** the page renders, **Then** FW-AUTH layout applies (muted viewport, brand mark, compact Card) and theme toggle is visible. |
| **US-F-ADM-DASH** | As a platform admin, I want the dashboard home on the dashboard framework | P1 | **Given** `/`, **When** the page loads inside FW-SHELL-ERP, **Then** FW-DASHBOARD presents metric/summary cards in a responsive grid with `PageHeader`. |
| **US-F-ADM-LIST** | As a platform admin, I want list pages on the list framework | **P0** | **Given** `/merchants`, `/orders`, or `/settlements`, **When** the list loads, **Then** each page has `PageHeader`, sticky table header, `Badge` status cells, skeleton loading, and `EmptyState` when no rows. |
| **US-F-ADM-DETAIL** | As a platform admin, I want merchant and cross-tenant detail on the detail framework | **P0** | **Given** `/merchants/[id]` or `/inventory/tenants/[tenantId]`, **When** the detail loads, **Then** FW-DETAIL shows title row, status/actions, and `Card` sections with optional embedded table; back navigation is obvious. |
| **US-F-ADM-SETTINGS** | As a platform admin, I want settings on the settings framework | P1 | **Given** `/settings`, **When** the page loads, **Then** FW-SETTINGS renders labeled sections in Cards with consistent vertical rhythm. |

### Merchant frameworks (`apps/merchant`)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| **US-F-MER-AUTH** | As a merchant user, I want login, register, and pending onboarding on auth frameworks | **P0** | **Given** `/login`, `/register`, or `/onboarding/pending`, **When** each page renders, **Then** FW-AUTH or FW-AUTH-STATUS applies, register keeps a stable outer frame across wizard steps, and theme toggle is available on auth routes. |
| **US-F-MER-BIND** | As a distributor scanning a QR code, I want the bind flow on the mobile bind framework | **P0** | **Given** `/bind/[token]` on a phone-width viewport, **When** the page renders, **Then** FW-BIND shows a single centered Card, primary CTA ≥44px tall, and readable status/error copy in light and dark themes. |
| **US-F-MER-DASH** | As a merchant owner, I want the home dashboard on the dashboard framework | P1 | **Given** `/`, **When** authenticated, **Then** FW-DASHBOARD shows summary metrics consistent with admin dashboard density. |
| **US-F-MER-LIST** | As merchant staff, I want all entity lists on the list framework | **P0** | **Given** any merchant list route (CRM, catalog, distributors, orders, inventory lists, activities), **When** the page loads, **Then** FW-LIST structure matches US-F-ADM-LIST patterns inside FW-SHELL-ERP. |
| **US-F-MER-DETAIL** | As merchant staff, I want detail pages on the detail framework | **P0** | **Given** `/distributors/[id]`, `/orders/[id]`, `/inventory/purchase-orders/[id]`, and (when shipped) CRM contact/lead detail, **When** I open a record, **Then** FW-DETAIL provides header, metadata cards, and line-item or timeline sections without breaking shell chrome. |
| **US-F-MER-FORM** | As merchant staff, I want create and adjustment flows on the form framework | **P0** | **Given** `/inventory/purchase-orders/new` or the adjustment form on `/inventory/adjustments`, **When** I interact with the form, **Then** FW-FORM uses Card-contained fields, inline validation, and primary/secondary actions aligned with ui-spec form examples. |
| **US-F-MER-SETTINGS** | As a merchant owner, I want settings pages on the settings framework | P1 | **Given** `/settings` or `/inventory/settings`, **When** the page loads, **Then** FW-SETTINGS applies. |
| **US-F-MER-REPORT** | As a merchant owner, I want inventory reports on the dashboard/report framework | P1 | **Given** `/inventory/reports`, **When** the page loads, **Then** FW-DASHBOARD + table combination matches report density (metrics on top, table below). |

### Store frameworks (`apps/store`)

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| **US-F-STORE-SHELL** | As a store customer, I want catalog, cart, checkout, and account on the consumer store framework with theme toggle in the header | **P0** | **Given** any FW-STORE route, **When** the page loads, **Then** `StoreShell` header/footer wrap content, cart/account affordances remain visible, and theme toggle is in the header (not ERP sidebar). **Given** light/dark toggle, **When** I browse products, **Then** product cards and prices remain readable. |
| **US-F-STORE-AUTH** | As a store customer, I want login and register on login-03 with store branding | **P0** | **Given** `/s/[slug]/login` or `/register`, **When** the page renders, **Then** FW-AUTH shows merchant display name as brand and theme toggle is available. |
| **US-F-STORE-BIND** | As a customer following a distributor link, I want the store bind flow on the mobile bind framework | P1 | **Given** `/s/[slug]/bind/[token]`, **When** on mobile, **Then** FW-BIND matches merchant bind touch targets and theme support. |
| **US-F-STORE-FORM** | As a store customer, I want checkout on the form framework | **P0** | **Given** `/s/[slug]/checkout`, **When** I complete the form, **Then** FW-FORM Card layout and CTAs meet 44px touch target guidance. |
| **US-F-STORE-LANDING** | As a visitor hitting the store app root, I want a minimal landing on the status framework | P2 | **Given** `/`, **When** the page loads, **Then** FW-AUTH-STATUS shows store entry guidance on muted background with theme support. |

### ui-spec showcase

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| **US-F-SPEC** | As a designer or engineer, I want every framework represented in ui-spec before portal rollout | **P0** | **Given** this PRD's framework IDs, **When** implementation starts, **Then** `apps/ui-spec/src/app/page.tsx` (or dedicated showcase sections) documents ERP shell, list, detail, form, settings, store header, bind card, and auth with `ModeToggle` — each cited in design docs. |

---

## Non-goals

- **Business gap closure** (store checkout slug, guest cart header, admin reject body, CRM activity API wiring) — remains in [platform-ui-blocks-and-gaps](./platform-ui-blocks-and-gaps.md) Workstream B; this PRD only defines frameworks those pages will use when built
- **Figma** files, Figma MCP, or design-tool deliverables
- **Rebranding** — new primary color, logo redesign, or non-Geist typography
- **New analytics** — charts, sparklines, or metric widgets beyond existing placeholder cards on dashboards
- **Store catalog visual redesign** beyond applying FW-STORE consistently (no marketing landing pages)
- **Admin tenant switcher** implementation (placeholder may remain in header)
- **Activity edit after create**, order fulfillment actions, payment UI — feature scope unchanged
- **Native mobile apps** — responsive web only; bind flows optimize for mobile web
- **Per-tenant custom themes** — single Meridian token set with light/dark/system mode only
- **login-04** split-panel auth — login-03 is canonical unless architect documents a store-specific exception

---

## Success metrics

| Metric | Target |
|--------|--------|
| Theme coverage | 100% of portal routes (42 + 2 planned CRM detail) render correctly in light and dark smoke check |
| Theme persistence | User selection persists across in-portal navigation (session/local per architect) |
| Shell parity | 100% admin + merchant authenticated routes use FW-SHELL-ERP (SidebarProvider stack) |
| Auth parity | 100% auth routes use FW-AUTH or FW-AUTH-STATUS with theme toggle |
| List framework adoption | 100% list routes use FW-LIST chrome (`PageHeader` + table + empty/loading states) |
| Detail framework adoption | 100% detail routes use FW-DETAIL chrome |
| Form framework adoption | 100% form-primary routes use FW-FORM chrome |
| ui-spec completeness | All framework IDs have a showcase section before corresponding portal merge |
| Accessibility | WCAG 2.1 AA on auth forms and shell nav; keyboard path to theme toggle |
| Regression | Existing Playwright/API e2e suites remain green after framework refactor |

---

## Dependencies on ui-spec showcase updates

Implementation is **blocked** on ui-spec for any framework not yet demonstrated. Required showcase additions (minimum):

| Framework | ui-spec deliverable |
|-----------|---------------------|
| FW-SHELL-ERP | SidebarProvider demo with collapsible sidebar-03 submenus + inset main + header slot for ModeToggle |
| FW-DASHBOARD | Metric card grid + optional chart placeholder row |
| FW-LIST | PageHeader + filter row optional + sticky Table + EmptyState + Skeleton |
| FW-DETAIL | Breadcrumb/back + PageHeader + multi-card layout + embedded Table |
| FW-FORM | Card-wrapped form with validation messages |
| FW-SETTINGS | Stacked settings Cards with Separator |
| FW-STORE | Consumer header mock with nav, cart badge, ModeToggle |
| FW-BIND | Centered status Card with primary CTA |
| FW-AUTH | login-03 composition (may elevate existing AuthLayout example) |
| ModeToggle + ThemeProvider | Already in ui-spec — export pattern documented for `packages/ui` |

Propagate primitives from `apps/ui-spec/src/components/ui/` to `packages/ui` without API drift.

---

## Open questions

| # | Question | Owner |
|---|----------|-------|
| 1 | Single `ThemeProvider` in each app layout vs shared wrapper in `packages/ui`? | architect |
| 2 | Theme preference storage: localStorage only, or cookie for SSR consistency? | architect |
| 3 | sidebar-03 vs sidebar-07 as canonical ERP sidebar — one choice for both portals? | architect / ui-designer |
| 4 | Should `packages/ui` expose named layout components (`ListPage`, `DetailPage`) or document composition recipes only? | architect |
| 5 | Store theme toggle: header icon only, or also on auth pages without duplicating controls? | ui-designer |
| 6 | FW-STORE: upgrade `StoreShell` in place vs new `StoreShellV2` behind feature flag? | architect |
| 7 | CRM detail routes: ship frameworks in this initiative or only when Workstream B lands? | product |
| 8 | Sequencing: ui-spec showcase first, then packages/ui, then portals — confirm per-portal or big-bang? | engineering |
| 9 | Icon library: keep `@tabler/icons-react` in shells while ui-spec uses `lucide-react` — document mapping? | ui-designer |
| 10 | Relationship to in-flight `platform-ui-blocks-and-gaps` PR: merge, supersede, or parallel branches? | engineering |

---

## Related documents

| Document | Path |
|----------|------|
| Prior UI blocks PRD (gap closure) | `docs/prd/platform-ui-blocks-and-gaps.md` |
| Design spec (route map) | `docs/design/platform-ui-blocks-and-gaps.md` |
| UI spec rules | `.cursor/rules/ui-spec.mdc` |
| Design system | `docs/design/design-system.md` |
| ui-spec showcase | `apps/ui-spec/src/app/page.tsx` |
| Existing shells | `packages/ui/src/components/shells/`, `auth-layout.tsx` |
