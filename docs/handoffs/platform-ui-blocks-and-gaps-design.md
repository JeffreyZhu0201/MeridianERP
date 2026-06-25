# Handoff: Platform UI Blocks & Gap Closure — UI Design

**Agent:** ui-designer  
**Date:** 2025-06-25  
**Branch:** TBD — branch from `develop` (e.g. `feature/platform-ui-blocks-and-gaps`)

## Scope

UI design complete for Workstream A (AuthLayout login-03, dashboard-01 Featured shells) and Workstream B P1 surfaces (merchant orders list/detail, CRM activities timeline + global log). ASCII wireframes, component mappings to `apps/ui-spec`, status badge tables, nav updates, and resolved PRD open questions documented.

**Deliverables:**

- Shared `AuthLayout` spec for admin, merchant (login/register wizard), store auth
- `AdminShell` / `MerchantShell` SidebarProvider restructure with nav additions (Orders, CRM Activities)
- Merchant `/orders`, `/orders/[id]` screen specs
- CRM contact/lead detail + `ActivityTimeline` + `/crm/activities` global list
- Accessibility and state tables (empty, loading, error)

**Explicit non-goals:** Figma, StoreShell browse redesign, checkout/cart UI layout, order fulfillment actions.

## Files

| Path | Action |
|------|--------|
| `docs/design/platform-ui-blocks-and-gaps.md` | Created — full UI spec |
| `docs/handoffs/platform-ui-blocks-and-gaps-design.md` | Created |

**References (read-only):** `docs/prd/platform-ui-blocks-and-gaps.md`, `docs/architecture/platform-ui-blocks-and-gaps.md`, `apps/ui-spec/src/components/ui/`, `packages/ui/src/components/empty-state.tsx`, `packages/ui/src/components/page-header.tsx`

## Screen list

### Workstream A

| Surface | Apps | Priority |
|---------|------|----------|
| `AuthLayout` | admin, merchant, store (auth routes) | P0 |
| `AdminShell` upgrade | admin | P0 |
| `MerchantShell` upgrade | merchant | P0 |
| Register wizard frame | merchant `/register` | P1 |
| Store auth branding | store `/s/[slug]/login`, `/register` | P1 |

### Workstream B (merchant)

| Route | Purpose | Priority |
|-------|---------|----------|
| `/orders` | Orders list table | P1 |
| `/orders/[id]` | Order detail (read-only) | P1 |
| `/crm/contacts/[id]` | Contact detail + activity timeline | P1 |
| `/crm/leads/[id]` | Lead detail + activity timeline | P1 |
| `/crm/activities` | Global activity log | P1 |

## Component mapping summary

| Domain UI | ui-spec / packages |
|-----------|-------------------|
| Auth frame | `Card`, `Form`, `Input`, `Button`, `ModeToggle` pattern → new `AuthLayout` |
| Shells | `SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarTrigger`, `SidebarMenuSub*` |
| Orders | `Table`, `Badge`, `PageHeader`, `EmptyState`, `Card`, `Skeleton` |
| Activities | `Select`, `Textarea`, `Badge`, `Separator`, `AlertDialog`, `Sonner` |
| Nav badges | `SidebarMenuBadge` (inventory alerts), `IconReceipt` (orders) |

## Design decisions

| Decision | Choice |
|----------|--------|
| Store auth brand | Merchant `businessName` + "Powered by MeridianERP" hint |
| Merchant orders | List + detail pages |
| CRM activities | Embedded timeline on detail + global `/crm/activities` |
| Activity delete | `AlertDialog` confirm; hard delete |
| Admin reject label | Display "Rejection reason"; API field `reason` |
| Sidebar primitives | Copy from ui-spec to `packages/ui` |
| Bind page | Unchanged — not wrapped in `AuthLayout` |

## Open questions

None blocking implementation — all PRD design questions resolved in design doc. Engineering sequencing per architecture ADR-10 (B P0 → A → B P1).

## Next agent

**nextjs-frontend** — Implement per `docs/design/platform-ui-blocks-and-gaps.md`:

1. Add `AuthLayout` and copy sidebar primitives to `packages/ui`
2. Refactor `AdminShell` / `MerchantShell` to SidebarProvider pattern
3. Wrap auth pages in all three apps
4. Build merchant orders and CRM activity surfaces
5. Link contacts/leads table rows to new detail routes

Coordinate with architecture for `@meridian/shared` types already defined in `crm.ts`, `ecommerce.ts`, `platform.ts`.
