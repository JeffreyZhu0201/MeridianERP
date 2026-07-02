# Bento Grid UI Redesign

**Version:** 1.0  
**Last updated:** 2025-06-25  
**Status:** Approved for implementation  
**Depends on:** Phase 1–4 portals, `packages/ui`, Phase 5 US-5.1 (store picker slice)

## Problem

All four portals use uniform metric grids (`sm:grid-cols-2 lg:grid-cols-5`) and lack visual hierarchy. Dashboards require multiple client fetches for charts and summaries. Store `/` is a static demo link. Distributor portal has no shared shell. List pages lack consistent skeleton/empty states.

## Users

| Persona | Goal |
|---------|------|
| Platform admin | Scan platform health at a glance with charts and recent activity |
| Merchant owner | See CRM, orders, inventory, and channel KPIs on one screen |
| Distributor | View performance trends and commission status |
| End customer | Pick a store from one entry page |

## Scope

- **49 portal pages** across `admin`, `merchant`, `store`, `distributor` (excluding non-production showcases)
- **Bento Grid** layout primitives in ui-spec → `packages/ui`
- **API extensions** for single-fetch dashboards + `GET /store/stores`
- **US-5.1** store picker at `apps/store` `/`

## Non-goals

- US-5.5+ invite codes, withdrawals, factory allocation
- Payment rails changes
- New fonts or marketing landing aesthetics
- Figma

## Page archetype matrix

| Archetype | Bento pattern | Count |
|-----------|---------------|-------|
| A — Dashboard | Full asymmetric Bento: KPI tiles, chart span-2, table/feed span-2 | 4 |
| B — List + metrics | `BentoListHeader` (2–4 tiles) + `ListPageFrame` table | 18 |
| C — Detail | `BentoDetailHero` + `DetailPageFrame` sections | 8 |
| D — Form | `FormPageFrame`; optional sidebar Bento preview tile | 10 |
| E — Auth / status | `AuthLayout` / `AuthStatusFrame` / `BindPageFrame` (no Bento) | 9 |

### Admin (8 pages)

| Route | Archetype |
|-------|-----------|
| `/` | A |
| `/login` | E |
| `/merchants` | B |
| `/merchants/[id]` | C |
| `/orders` | B |
| `/settlements` | B |
| `/settings` | D |
| `/inventory/tenants/[tenantId]` | C |

### Merchant (28 pages)

| Route | Archetype |
|-------|-----------|
| `/` | A |
| `/login`, `/register`, `/onboarding/pending`, `/bind/[token]` | E |
| `/crm/contacts`, `/companies`, `/leads`, `/activities` | B |
| `/catalog/products`, `/catalog/categories` | B |
| `/inventory/warehouses`, `/stock`, `/adjustments`, `/alerts`, `/purchase-orders`, `/transfers`, `/reports` | B |
| `/inventory/purchase-orders/new`, `/transfers/new` | D |
| `/inventory/purchase-orders/[id]` | C |
| `/inventory/settings` | D |
| `/orders`, `/distributors`, `/commissions` | B |
| `/orders/[id]`, `/distributors/[id]` | C |
| `/settings` | D |

### Store (11 pages)

| Route | Archetype |
|-------|-----------|
| `/` | A (store picker US-5.1) |
| `/s/[slug]` | A (featured + catalog Bento) |
| `/s/[slug]/products/[productSlug]` | C |
| `/s/[slug]/cart`, `/checkout` | D |
| `/s/[slug]/account` | B |
| `/s/[slug]/login`, `/register`, `/bind/[token]` | E |
| `/s/[slug]/orders/[id]/confirmation` | E |

### Distributor (3 pages)

| Route | Archetype |
|-------|-----------|
| `/` | A |
| `/commissions` | B |
| `/login` | E |

## User stories

| ID | Story | Priority | Acceptance criteria |
|----|-------|----------|---------------------|
| US-B1 | As a **developer**, I want Bento primitives in ui-spec so portals share one layout contract | P0 | **Given** ui-spec showcase, **When** I toggle dark mode, **Then** Bento tiles use `ring-foreground/10` and support `colSpan`/`rowSpan` 1–3; mobile collapses to 1 column |
| US-B2 | As a **portal user**, I want dashboard data in one API call | P0 | **Given** admin/merchant/distributor home, **When** SSR loads, **Then** exactly one `GET */dashboard` includes KPIs + optional `trend[]` |
| US-B3 | As an **end customer**, I want a store picker at `/` (US-5.1) | P0 | **Given** published stores exist, **When** I open `/`, **Then** I see searchable store list; selecting navigates to `/s/{slug}`; last choice stored 30 days in localStorage |
| US-B4 | As a **user**, I want consistent loading and empty states on list pages | P0 | **Given** any list page, **When** loading or empty, **Then** Skeleton or EmptyState from `@meridian/ui` is shown |
| US-B5 | As a **distributor**, I want a proper shell with locale and theme toggles | P0 | **Given** authenticated distributor, **When** any page loads, **Then** `DistributorShell` renders nav + toggles |

## Success metrics

- All 49 pages use `@meridian/ui` primitives aligned with ui-spec
- Dashboard SSR: ≤1 API call per home page
- Playwright smoke: four portal homes + store picker pass
- `turbo build` green

## Resolved doc items

- G-3 platform dashboard: **implemented** — extend, do not recreate
- G-4 merchant detail enrichment: **implemented**
