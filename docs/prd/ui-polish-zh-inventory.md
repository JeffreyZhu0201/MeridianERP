# UI Polish — Chinese Inventory Localization & UX

## Problem

Phase 3 merchant inventory is functionally complete but ships in English with uneven UX polish. Primary users are Chinese-speaking merchant owners and staff who need inventory screens in their working language, clearer empty and error states, and consistent data-dense dashboard patterns. Developer-facing inventory code lacks Chinese comments, slowing onboarding for the team. E2E coverage only smoke-tests three routes; Figma frames were deferred during Phase 3 design.

## Users

| Persona | Goals |
|---------|-------|
| Merchant Owner (ZH) | Read warehouse, stock, PO, and report screens without English friction |
| Merchant Staff (ZH) | Complete adjustments and receives with clear validation feedback |
| MeridianERP developers | Understand inventory module intent via Chinese code comments |
| QA / CI | Regression-proof login and all inventory routes via Playwright |

## Scope

| Area | In scope |
|------|----------|
| **UI copy** | Simplified Chinese labels, headings, nav, table headers, buttons, badges, toasts, dialogs on all merchant `/inventory/*` routes |
| **Empty states** | Purposeful empty copy + primary CTA where applicable (warehouses, stock, adjustments history, alerts, PO list, reports) |
| **Form validation** | Inline field errors and submit-level feedback in Chinese for inventory forms (warehouse, adjustment, PO create/receive, settings) |
| **UX polish** | Align with data-dense dashboard pattern: `text-sm` body, compact table density, sticky headers, consistent `space-y-6` page rhythm, loading skeletons, badge semantics per design system |
| **Code comments** | Chinese comments on inventory-related modules in `apps/merchant/app/inventory`, `apps/merchant/lib/inventory.ts`, `apps/api` inventory module, and `packages/ui` inventory components |
| **Figma sync** | Merchant inventory screens pushed/updated in Figma; `docs/design/phase-3-inventory.md` annotated with frame links |
| **E2E** | Playwright: merchant login + navigation assertion on every inventory route |

### Inventory routes (merchant)

`/inventory/warehouses`, `/inventory/stock`, `/inventory/adjustments`, `/inventory/alerts`, `/inventory/purchase-orders`, `/inventory/purchase-orders/new`, `/inventory/purchase-orders/[id]`, `/inventory/reports`, `/inventory/settings`

## User Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-ZH-1 | As a Chinese-speaking merchant, I want inventory UI in Simplified Chinese so that I can operate without translating mentally | P0 | Given I am logged into the merchant portal, When I visit any `/inventory/*` route, Then page titles, sidebar labels, table headers, buttons, status badges, and dialog copy are displayed in Simplified Chinese. Given I switch between inventory sub-routes, Then nav labels remain Chinese and match the active route. |
| US-ZH-2 | As a merchant staff, I want helpful empty states so that I know what to do when there is no data | P0 | Given a list or table with zero rows (warehouses, stock, adjustment history, alerts, purchase orders, or report tab), When the page loads, Then I see a Chinese empty-state message explaining why it is empty and, where applicable, a primary CTA (e.g. “创建仓库”, “新建采购单”). Given data later exists, Then the empty state is replaced by the table without layout shift beyond skeleton → content. |
| US-ZH-3 | As a merchant staff, I want form validation feedback in Chinese so that I can fix mistakes quickly | P0 | Given an inventory form (warehouse create/edit, stock adjustment, PO create, PO receive, reorder settings), When I submit with missing or invalid fields, Then inline errors appear adjacent to the field in Chinese describing the issue. When the API returns a business error (e.g. negative stock adjustment), Then a visible error message in Chinese is shown without silent failure. |
| US-ZH-4 | As QA, I want Playwright to cover login and all inventory routes so that regressions are caught in CI | P0 | Given the Docker dev stack and seeded demo merchant, When Playwright runs the inventory E2E suite, Then it logs in via `/login` and successfully loads each inventory route listed in Scope with `main` visible and the expected Chinese page heading (or `h1`) present. Given any route returns 5xx or login fails, Then the test fails or skips with an explicit reason (not a false pass). |
| US-ZH-5 | As a developer, I want Chinese comments in inventory modules so that I can maintain the feature faster | P1 | Given inventory-related source files in merchant app, API inventory module, and shared inventory UI components, When a developer opens a non-trivial function, component, or service method, Then a concise Chinese comment explains business intent (not a line-by-line translation). Given trivial getters or re-exports, Then comments are omitted. |
| US-ZH-6 | As a designer, I want Figma frames synced with implemented inventory UI so that design and code stay aligned | P1 | Given implemented merchant inventory screens, When Figma sync completes, Then each P0 route has a corresponding Figma frame and `docs/design/phase-3-inventory.md` links to frame URLs. Given UI drift during polish, Then Figma is updated to match shipped Chinese UI before merge. |
| US-ZH-7 | As a merchant user, I want inventory pages to feel consistent with the ERP dashboard pattern so that dense data is scannable | P1 | Given any inventory list or report page, When rendered at desktop width, Then typography follows design system density (`text-2xl` page title, `text-sm` body, `text-xs` table meta), tables use sticky headers where scrollable, and loading states use Skeleton—not blank flash. Given status semantics (low stock, PO status, adjustment reason), Then badge colors match design system (`emerald-600` success, `amber-600` warning, `destructive` for errors). |

## Non-Goals

- **Full application i18n framework** — no `next-intl`, locale switcher, or translation file infrastructure for the whole monorepo in this iteration
- **Admin portal localization** — `apps/admin` inventory support view remains English
- **Storefront / catalog localization** — out of scope; catalog sellable-qty link may stay English unless already inside an inventory route
- **Traditional Chinese (zh-TW)** — Simplified Chinese (`zh-CN`) only
- **Backend API error message localization** — merchant UI maps known API codes to Chinese; generic 500 messages may remain technical English in logs only
- **New inventory features** — no new warehouses, PO, or reporting capabilities; polish and localization only
- **Visual rebrand** — no new color palette or typography family; apply existing design tokens

## Success Metrics

| Metric | Target |
|--------|--------|
| Inventory route Chinese coverage | 100% of scoped `/inventory/*` UI strings in Simplified Chinese |
| Empty-state coverage | 100% of P0 list/table views have Chinese empty state + CTA where create action exists |
| Form validation coverage | 100% of P0 inventory forms show Chinese inline errors on invalid submit |
| Playwright route coverage | 100% of 9 inventory routes (+ login) pass in CI when stack is up |
| Figma frame coverage | 100% of P0 merchant inventory routes linked from design doc |
| Comment coverage (inventory modules) | ≥ 80% of non-trivial exported functions/components in scoped modules have intent comments |
| Zero English regression in nav | Inventory sidebar group shows Chinese labels only |

## Open Questions

| # | Question | Notes for architect |
|---|----------|---------------------|
| 1 | String strategy without i18n framework | Inline constants vs single `inventory-zh.ts` dictionary per app; avoid patterns that block future i18n |
| 2 | Playwright selectors for Chinese UI | Prefer `data-testid` for route shells vs role+name in Chinese |
| 3 | API error code → Chinese message map | Which inventory endpoints return structured codes vs free-text `message`? |
| 4 | Figma file target | New file vs extend existing MeridianERP merchant library |
| 5 | Comment scope boundary | Include `packages/shared` inventory Zod schemas and enums, or UI/API only? |
| 6 | Catalog product sheet sellable qty | Translate the read-only inventory link in catalog Sheet (P1) or strictly `/inventory/*` only? |

## Dependencies

- Phase 3 inventory implementation merged on `develop`
- `docs/design/design-system.md` and `docs/design/phase-3-inventory.md`
- Demo merchant seed (`demo@merchant.test`) for Playwright
- Figma MCP access for frame sync (Phase 3 UI spec handoff)
