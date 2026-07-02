# Platform UI Blocks & Gap Closure

**Version:** 1.0  
**Last updated:** 2025-06-25  
**Status:** Discovery complete — ready for architecture  
**Related:** [platform-overview.md](./platform-overview.md), [design-system.md](../design/design-system.md), [phase-1-foundation.md](./phase-1-foundation.md), [phase-2-ecommerce.md](./phase-2-ecommerce.md)

## Problem

MeridianERP portals have diverged from the established design system and shadcn block patterns. Auth screens lack a consistent visual language across admin, merchant, and store; portal shells use a legacy layout that does not match the shared `packages/ui` sidebar primitive or the dashboard-01 Featured shell pattern. In parallel, several P0/P1 integration gaps block core flows documented in [platform-overview.md](./platform-overview.md): storefront checkout and guest cart are broken, admin merchant rejection fails on an API contract mismatch, and merchant-facing order and CRM activity surfaces were never wired despite working APIs.

This initiative delivers two coordinated workstreams: a UI refresh that raises visual and structural consistency without rebranding, and targeted gap closure that unblocks Phase 1 US-7 and Phase 2 checkout/orders for real end-to-end use.

## Users

| Persona | Workstream | Goals |
|---------|------------|-------|
| Platform Super Admin | A, B | Professional admin portal; reliable merchant approve/reject |
| Platform Ops | A, B | Review applications without broken reject flow |
| Merchant Owner | A, B | Cohesive portal shell; view incoming store orders |
| Merchant Staff | A, B | Log CRM activities on contacts/leads; navigate dense ERP UI |
| End Customer (store) | A, B | Consistent auth UX; complete guest or logged-in checkout |

---

## Workstream A — shadcn Blocks UI Refresh

Align portal auth and shell layouts with shadcn block references while preserving MeridianERP tokens (Geist, blue primary, ERP density) and sourcing sidebar behavior from `packages/ui`.

**Reference patterns (visual/structural, not pixel copies):**

| Pattern | shadcn block | Apply to |
|---------|--------------|----------|
| Auth | [login-03](https://ui.shadcn.com/blocks/login#login-03) | Admin login, merchant login/register, store login/register |
| Dashboard shell | [dashboard-01](https://ui.shadcn.com/blocks/dashboard#dashboard-01) Featured | `AdminShell`, `MerchantShell` |

### User Stories — Workstream A

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-A1 | As any portal user, I want auth pages with a consistent login-03-style layout so that sign-in feels professional and on-brand | P0 | **Given** I open an unauthenticated auth route (admin `/login`, merchant `/login` or `/register`, store `/s/[slug]/login` or `/register`), **When** the page renders, **Then** I see a muted full-viewport background, a centered brand mark (MeridianERP wordmark or tenant/store name where applicable), and a compact form card with primary CTA. **Given** light or dark theme, **When** I toggle theme on auth pages that expose it, **Then** contrast meets WCAG 2.1 AA using existing CSS variables from `packages/ui/styles/globals.css`. |
| US-A2 | As a platform admin, I want the admin portal shell to follow the dashboard-01 Featured sidebar pattern so that navigation matches modern ERP expectations | P0 | **Given** I am authenticated in `apps/admin`, **When** any shell-wrapped page loads, **Then** the layout uses `SidebarProvider`, a collapsible sidebar built from `packages/ui` sidebar primitives, `SidebarInset` for main content, and a site header with `SidebarTrigger`. **Given** the sidebar is collapsed, **When** I expand it, **Then** nav labels and submenus are readable without layout shift breaking the main content area. |
| US-A3 | As a merchant user, I want the merchant portal shell upgraded to the same Featured shell pattern so that CRM, catalog, inventory, and orders feel like one product | P0 | **Given** I am authenticated in `apps/merchant`, **When** any shell-wrapped page loads, **Then** `MerchantShell` matches US-A2 structural pattern (SidebarProvider, collapsible sidebar with submenus where nav groups exist, SidebarInset, header with SidebarTrigger). **Given** nested nav (e.g. Inventory → Warehouses, Purchase Orders), **When** I open a submenu, **Then** the active route is highlighted and submenu state persists across navigation within the session. |
| US-A4 | As a merchant applicant, I want the registration wizard inside the same auth visual language so that onboarding feels continuous with login | P1 | **Given** I am on merchant `/register`, **When** I progress through wizard steps, **Then** the outer auth frame (muted bg, brand mark, card container) remains stable while only the inner form step content changes. **Given** validation errors on a step, **When** I submit, **Then** errors appear inline within the card without breaking the auth layout. |
| US-A5 | As a store customer, I want store login and register pages to match portal auth styling so that the storefront feels trustworthy | P1 | **Given** I visit `/s/[slug]/login` or `/s/[slug]/register`, **When** the page renders, **Then** it follows US-A1 auth layout and displays the store/merchant display name in the brand area. **Given** I complete registration, **When** I am redirected, **Then** I land on the intended post-auth route without auth layout regressions. |
| US-A6 | As a user who prefers reduced motion, I want shell transitions to respect accessibility settings so that the UI does not cause discomfort | P1 | **Given** `prefers-reduced-motion: reduce`, **When** I collapse or expand the sidebar, **Then** animated transitions are disabled or minimized per design-system rules. |

---

## Workstream B — Platform Gap Closure

Close documented cross-cutting gaps (G-1, G-5, G-6, G-10, G-11) from [platform-overview.md](./platform-overview.md). Scope is UI/API contract alignment and net-new merchant surfaces for existing APIs — not new backend capabilities.

### User Stories — Workstream B

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-B1 | As a store customer, I want checkout to submit against my store's slug so that orders are created for the correct tenant | P0 | **Given** a cart with items for store slug `acme`, **When** I submit checkout from `/s/acme/checkout`, **Then** the client calls the store-scoped checkout endpoint (not a generic `/store/checkout` path). **Given** a successful checkout response, **When** the order is created, **Then** the order's `tenantId` matches the store behind `acme`. **Given** checkout fails (empty cart, oversell, validation), **When** the API returns an error, **Then** I see an inline or toast error without a silent failure. |
| US-B2 | As a guest store customer, I want my cart session honored on API requests so that I can browse and checkout without logging in | P0 | **Given** I have not logged in, **When** the store app loads or mutates the cart, **Then** a stable cart session identifier is established (cookie and/or client storage per architect decision). **Given** guest cart API calls, **When** the client fetches or updates the cart or proceeds to checkout, **Then** the `X-Cart-Session` header is sent on every required request. **Given** I add items as a guest and later log in, **When** merge behavior is defined, **Then** I do not lose cart contents without explicit user feedback (merge or replace communicated in UI). |
| US-B3 | As a platform admin, I want to reject a merchant application with a reason so that the applicant receives accurate feedback | P0 | **Given** a merchant in `SUBMITTED` or `UNDER_REVIEW` status, **When** I reject with a reason in the admin UI, **Then** the request body uses the API contract field `reason` (not `rejectionReason`). **Given** a successful reject, **When** the merchant views their application status, **Then** the stored rejection reason is visible. **Given** I omit the reason, **When** I attempt reject, **Then** client validation blocks submit. |
| US-B4 | As a merchant owner, I want to list orders from my storefront so that I can fulfill customer purchases | P1 | **Given** I am authenticated as a merchant user, **When** I open the orders list in the merchant portal, **Then** the UI loads data from the existing merchant orders list API. **Given** orders exist, **When** the list renders, **Then** I see at minimum order identifier, status, total, and created date in ERP-dense table format. **Given** no orders, **When** the list loads, **Then** I see an empty state with guidance (not an error). **Given** I select an order row, **When** detail is in scope for this iteration, **Then** I can navigate to an order detail view or expandable row per architect/design decision. |
| US-B5 | As a merchant staff member, I want to log CRM activities on contacts and leads so that I have an audit trail (Phase 1 US-7) | P1 | **Given** I view a contact or lead detail in the merchant CRM, **When** I add an activity (type `CALL`, `NOTE`, or `MEETING`), **Then** it is created via the existing activities API and appears in a timeline on that record. **Given** activities exist for my tenant, **When** I open a global activities list (if provided), **Then** I see only my tenant's activities. **Given** an activity I created, **When** I delete it, **Then** it is removed from the timeline after confirmation. **Given** I am `MERCHANT_STAFF`, **When** I perform activity CRUD, **Then** the same permissions apply as other CRM write actions. |

---

## Non-Goals

### Workstream A

- Full dashboard analytics charts, sparklines, or metric widgets beyond existing placeholder/summary cards
- Figma file creation, Figma MCP sync, or design-tool deliverables
- Rebranding: new primary color, logo redesign, or typography changes outside Geist + existing tokens
- `StoreShell` consumer browse layout redesign (catalog, PDP, cart page chrome) — auth pages only for store
- Tenant switcher implementation for admin (separate initiative; G-3 dashboard API out of scope)
- Mobile-native apps or responsive redesign beyond existing 44px touch-target rules on bind/auth flows

### Workstream B

- Stripe Payment Element / live payment UI (G-9) — checkout may still end at pending order + simulate-payment in test
- Store customer order history / account page (G-8)
- Customer QR distributor bind contract fix (G-7)
- Admin merchant list filter wiring (G-2), merchant detail enriched payload (G-4), platform dashboard API (G-3)
- New activity types, email/SMS activity logging, or activity edit after create
- Merchant order fulfillment workflow (ship, refund, cancel) beyond read list/detail
- Backend API changes except where required to support correct client contracts (reject body is UI-only fix)

---

## Success Metrics

| Metric | Target | Workstream |
|--------|--------|------------|
| Auth page visual parity | 100% of scoped auth routes pass design review checklist (muted bg, brand mark, card form) | A |
| Shell structural parity | Admin + merchant shells use SidebarProvider / SidebarInset / SidebarTrigger on all shell routes | A |
| Store checkout E2E | Playwright or manual: guest adds to cart → checkout → order created for correct slug | B |
| Guest cart header compliance | 100% of store cart/checkout API calls from UI include `X-Cart-Session` when unauthenticated | B |
| Admin reject success rate | 100% of reject actions from admin UI return 2xx with `reason` payload | B |
| Merchant orders visibility | Merchant user can load orders list with ≥1 row when API e2e seed order exists | B |
| CRM US-7 completion | Activity create + list + delete on contact/lead covered by merchant UI test or Playwright smoke | B |
| Regression | Existing API e2e suites (`store-checkout`, `crm`, `merchant-onboarding`) remain green | A + B |
| Accessibility | Auth forms and shell nav keyboard-operable; focus rings visible | A |

---

## Open Questions

| # | Question | Owner | Notes |
|---|----------|-------|-------|
| 1 | Should `packages/ui` shells be refactored in place or should admin/merchant import sidebar primitives directly from a shared ui-spec re-export? | architect | Affects duplication vs single source of truth |
| 2 | Store brand mark on auth: platform MeridianERP logo, merchant business name, or both? | product / ui-designer | Store routes have slug context |
| 3 | Guest cart session: generate client-side UUID vs rely on API Set-Cookie? Persist across tabs? | architect | Must align with `GuestCartGuard` |
| 4 | Guest-to-logged-in cart merge: merge lines, replace, or prompt user? | product | Phase 2 e2e uses API only today |
| 5 | Merchant orders: list-only MVP vs list + detail page in same PR? | product | API has `GET /merchant/orders/:id` |
| 6 | CRM activities: embed timeline only on contact/lead detail vs dedicated `/activities` route? | ui-designer | API supports global `GET /merchant/activities` |
| 7 | Activity delete: hard delete vs soft-delete; confirm dialog pattern? | architect | API currently hard deletes |
| 8 | Workstream sequencing: ship B P0 fixes before A shell refactor to reduce merge conflict risk? | engineering | Recommended but not prescriptive |
| 9 | Playwright coverage: extend `phase-2-store.spec.ts` for UI checkout or new `platform-gaps.spec.ts`? | test-engineer | Map to US-B1/B2 |
| 10 | Admin reject: align only request field or also rename display copy from "rejection reason" to "reason"? | ui-designer | Display can stay user-friendly |

---

## Related Documents

| Document | Path |
|----------|------|
| Platform overview & gap register | `docs/prd/platform-overview.md` |
| Design system | `docs/design/design-system.md` |
| UI sidebar primitive | `packages/ui/src/components/ui/sidebar.tsx` |
| Phase 1 US-7 (activities) | `docs/prd/phase-1-foundation.md` |
| Phase 2 checkout gaps | `docs/prd/phase-2-ecommerce.md` |
| Admin wireframes | `docs/design/phase-1-admin.md` |
| Merchant wireframes | `docs/design/phase-1-merchant.md` |
