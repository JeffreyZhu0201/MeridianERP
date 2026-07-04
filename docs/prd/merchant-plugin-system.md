# Merchant Plugin System — PRD

**Version:** 1.0.0  
**Updated:** 2026-07-04

## Problem

MeridianERP is a mature multi-tenant SaaS. Business modules (CRM, HRM, IM, finance/tax, collaborative OA, e-signature, customer service) are either always visible or not yet productized. Merchants cannot choose which optional capabilities to enable, and platform admins cannot see per-tenant module adoption. A plugin infrastructure is needed so optional modules can be installed/uninstalled per tenant while ecommerce core remains always available.

## Users

| User | Portal | Need |
|------|--------|------|
| Branch merchant owner | `apps/merchant` | Browse plugin marketplace, install/uninstall optional modules |
| Branch staff (non-owner) | `apps/merchant` | Use installed modules; read-only on marketplace |
| Platform admin / reviewer | `apps/admin` | View which plugins each merchant has installed |

## User Stories

### US-MP1 — Plugin marketplace (P0)

As a merchant owner, I open `/plugins` and see all available plugins with descriptions and install status.

**Given** I am logged in as `MERCHANT_OWNER`  
**When** I visit `/plugins`  
**Then** I see cards for CRM, HRM, IM, finance/tax, OA, e-signature, and customer service with Install or Uninstall actions

### US-MP2 — Nav reflects installed plugins (P0)

As a merchant user, sidebar navigation shows only installed plugin modules.

**Given** HRM is not installed  
**When** I view any merchant page  
**Then** HRM does not appear in the sidebar  
**Given** I install HRM as owner  
**When** the page refreshes  
**Then** HRM appears in the sidebar

### US-MP3 — CRM gated when uninstalled (P0)

As a merchant without CRM installed, I cannot access CRM routes or API.

**Given** CRM is uninstalled for my tenant  
**When** I visit `/crm/contacts` or call `GET /merchant/contacts`  
**Then** I am redirected to `/plugins?highlight=crm` (UI) or receive `403 PLUGIN_NOT_INSTALLED` (API)

### US-MP4 — Admin read-only plugin view (P0)

As a platform admin, I see plugin installation status on the merchant detail page.

**Given** I am `SUPER_ADMIN` or `REVIEWER`  
**When** I open `/merchants/{id}`  
**Then** I see a plugins card listing each catalog plugin with installed/not installed and install timestamp when applicable

### US-MP5 — Default CRM on signup (P0)

As a newly approved merchant, CRM is installed by default.

**Given** a tenant is created or approved  
**When** the tenant first accesses the merchant portal  
**Then** CRM appears in navigation and CRM API is accessible

### US-MP6 — Stub plugin placeholder (P0)

As a merchant who installed a non-CRM plugin, I see a coming-soon page.

**Given** I installed HRM  
**When** I click HRM in the sidebar  
**Then** I see an EmptyState with a message that the module is coming soon and a link back to `/plugins`

### US-MP7 — Core modules always on (P0)

As any merchant, ecommerce core modules remain available regardless of plugin settings.

**Given** any plugin install state  
**When** I use the merchant portal  
**Then** Dashboard, Catalog, Inventory, Orders, Allocations, Funds, Replenishment, Commissions, and Settings remain in navigation

### US-MP8 — Owner-only install/uninstall (P1)

As a non-owner merchant user, I cannot install or uninstall plugins.

**Given** I am `MERCHANT_STAFF`  
**When** I visit `/plugins`  
**Then** Install/Uninstall buttons are disabled with an owner-only hint

### US-MP9 — Uninstall confirmation (P1)

As a merchant owner uninstalling CRM, I see a confirmation dialog warning that data is retained.

### US-MP10 — Admin force install (P2)

As platform admin, I can install/uninstall plugins on behalf of a merchant (future).

## Non-Goals (P0)

- Plugin billing, subscriptions, or usage metering
- Admin force install/uninstall
- Full MVP for HRM, IM, finance/tax, OA, e-signature, or customer service
- Plugin versioning, dependency resolution, or marketplace ratings
- Removing or plugin-wrapping ecommerce core (catalog, inventory, orders)

## Success Metrics

- 100% of existing tenants have CRM installed after migration
- Plugin install/uninstall API e2e tests pass
- CRM API returns `403 PLUGIN_NOT_INSTALLED` when CRM is uninstalled
- Merchant Playwright smoke covers install HRM → nav appears → stub page
- Admin merchant detail shows plugin status for all 7 catalog entries

## Open Questions

- Should uninstalling CRM hide historical CRM data from UI only, or also block exports? **P0:** hide nav/API only; data retained in DB.
- Should `COMING_SOON` catalog plugins be installable in P0? **P0:** all 7 are installable; stubs show EmptyState.
- Plugin nav order: fixed sortOrder in catalog vs user-configurable? **P0:** fixed `sortOrder` in seed.
