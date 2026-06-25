# Handoff: Platform UI Blocks & Gap Closure — Discovery

**Agent:** product-manager  
**Date:** 2025-06-25  
**Branch:** TBD — branch from `develop` (e.g. `feature/platform-ui-blocks-and-gaps`)

## Scope

Discovery complete for two coordinated workstreams:

**Workstream A — shadcn Blocks UI Refresh (P0/P1)**  
- Auth pages (admin, merchant login/register wizard, store login/register) aligned to login-03 pattern: muted full-viewport bg, centered brand mark, compact form card  
- `AdminShell` and `MerchantShell` upgraded toward dashboard-01 Featured: `SidebarProvider`, collapsible sidebar with submenus, `SidebarInset`, site header with `SidebarTrigger`  
- Must follow Geist, blue primary, ERP density, and `apps/ui-spec` sidebar primitive  
- Explicit non-goals: dashboard charts, Figma, color rebrand, StoreShell catalog redesign

**Workstream B — Platform Gap Closure (P0/P1)**  
- **P0:** Store checkout uses slug-scoped path (G-5); guest cart sends `X-Cart-Session` (G-6)  
- **P0:** Admin merchant reject sends `{ reason }` not `{ rejectionReason }` (G-1)  
- **P1:** Merchant orders list UI → existing `GET /merchant/orders` (G-11)  
- **P1:** CRM activities UI for Phase 1 US-7 — list/create/delete on contacts/leads (G-10)

Out of scope for this initiative: Stripe Payment Element (G-9), customer bind (G-7), account/history (G-8), admin dashboard API (G-3), merchant list filters (G-2).

## Files

- `docs/prd/platform-ui-blocks-and-gaps.md`
- `docs/handoffs/platform-ui-blocks-and-gaps-discovery.md`

## Open questions

1. Shared shell refactor path: `packages/ui` vs ui-spec re-export strategy  
2. Store auth brand mark: platform vs merchant name  
3. Guest cart session lifecycle and guest→login merge behavior  
4. Merchant orders MVP: list-only vs list + detail in same delivery  
5. CRM activities placement: embedded timeline vs global `/activities` route  
6. Recommended delivery order: B P0 before A shell refactor to reduce conflicts  
7. Playwright extension target for checkout/guest cart UI verification

## Next agent

**architect** — produce `docs/architecture/platform-ui-blocks-and-gaps.md` with shell component boundaries, store client session contract, merchant orders/activities UI data flow, and test mapping. No new API endpoints unless guest session merge requires it.
