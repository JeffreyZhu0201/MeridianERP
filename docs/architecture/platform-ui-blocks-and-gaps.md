# Platform UI Blocks & Gap Closure — Architecture

**Version:** 1.0  
**Last updated:** 2025-06-25  
**PRD:** [platform-ui-blocks-and-gaps.md](../prd/platform-ui-blocks-and-gaps.md)

## Overview

Two coordinated workstreams with **no new backend endpoints** except optional future guest-cart merge. Backend APIs for checkout, merchant orders, CRM activities, and merchant reject already exist; this initiative aligns frontend contracts and refreshes portal shells/auth layouts.

**Recommended delivery order** (reduces merge conflict risk):

1. **Workstream B P0** — checkout path, guest cart header, admin reject DTO (small, isolated diffs)
2. **Workstream A** — `AuthLayout`, sidebar primitive copy, shell refactor
3. **Workstream B P1** — merchant orders UI, CRM activities UI + contact/lead detail routes

Shared client contracts added to `packages/shared` (`platform.ts`, `crm.ts`, `ecommerce.ts`) so admin, merchant, and store apps can import types before implementation.

---

## Workstream A — UI Refresh

### A1. Shared `AuthLayout` (`packages/ui`)

**Location:** `packages/ui/src/components/layouts/auth-layout.tsx`

**Pattern:** shadcn [login-03](https://ui.shadcn.com/blocks/login#login-03) — muted full-viewport background, centered brand mark, compact form card.

```typescript
export interface AuthLayoutProps {
  /** Primary brand line — e.g. "MeridianERP" or store business name */
  brandTitle: string;
  /** Secondary line — e.g. "Platform Admin", "Merchant Portal" */
  brandSubtitle?: string;
  /** Optional tertiary — e.g. "Powered by MeridianERP" on store auth */
  brandHint?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Show theme toggle when portal root layout supports it */
  showThemeToggle?: boolean;
}
```

**Structure:**

```
AuthLayout
├── div.min-h-svh.bg-muted (full viewport)
└── div.flex.flex-col.items-center.justify-center.p-6
    ├── Brand block (text-center, wordmark + subtitle)
    ├── Card.max-w-sm (children = form / wizard step)
    └── footer slot (links, theme toggle)
```

**Consumers:**

| App | Routes | Brand |
|-----|--------|-------|
| `apps/admin` | `/login` | MeridianERP / Platform Admin |
| `apps/merchant` | `/login`, `/register` (wizard steps) | MeridianERP / Merchant Portal |
| `apps/store` | `/s/[slug]/login`, `/s/[slug]/register` | `{businessName}` from store context; `brandHint="Powered by MeridianERP"` |

**Export:** add to `packages/ui/src/index.ts`.

**Module boundary:** Auth pages remain in each app; only the outer frame moves to `@meridian/ui`. Form logic, API calls, and cookies stay app-local.

**Non-goals:** No changes to middleware, JWT handling, or register wizard state machine — only wrap existing step content in `AuthLayout`.

---

### A2. Shell refactor — SidebarProvider pattern

#### Decision: copy sidebar primitive to `packages/ui` (not incremental wrap, not direct ui-spec import)

| Option | Verdict |
|--------|---------|
| Apps import `apps/ui-spec` directly | **Reject** — ui-spec is a dev showcase, not a published package |
| Incrementally wrap legacy `<aside>` in existing shells | **Reject** — leaves duplicate collapse/mobile logic; does not achieve dashboard-01 structure |
| **Copy `sidebar.tsx` + dependencies from ui-spec → `packages/ui`, then refactor shells** | **Accept** |

**Rationale:** Matches `.cursor/rules/ui-spec.mdc` workflow (ui-spec first, propagate to `packages/ui`). Single consumption layer for all portals.

#### Files to copy/adapt from ui-spec

| Source | Target |
|--------|--------|
| `apps/ui-spec/src/components/ui/sidebar.tsx` | `packages/ui/src/components/ui/sidebar.tsx` |
| `apps/ui-spec/src/hooks/use-mobile.ts` | `packages/ui/src/hooks/use-mobile.ts` |

**Additional primitives** (if not already in `packages/ui`): `Separator`, `Tooltip`, `Skeleton` — mirror ui-spec APIs.

**CSS:** Ensure portal `globals.css` includes sidebar CSS variables from ui-spec (`--sidebar`, `--sidebar-foreground`, etc.).

#### Refactored shell composition (dashboard-01 Featured)

```
SidebarProvider
├── AppSidebar (nav config — admin vs merchant)
│   ├── SidebarHeader (portal title)
│   ├── SidebarContent (SidebarGroup + SidebarMenu + collapsible submenus)
│   └── SidebarFooter (optional)
└── SidebarInset
    ├── SiteHeader (SidebarTrigger, user email, sign out)
    └── main (children — page content, py-4 px-6)
```

**Shared subcomponents** (optional extraction within `packages/ui/src/components/shells/`):

- `shell-header.tsx` — `SidebarTrigger`, user menu, logout
- `shell-nav.tsx` — generic renderer for flat + nested nav items (used by both shells)

**AdminShell changes:**

- Replace custom `useState(collapsed)` + top `<header>` with `SidebarProvider` layout
- Preserve existing flat nav items (Dashboard, Merchants, Orders, Settlements, Settings)
- Tenant switcher placeholder unchanged (non-goal G-3)

**MerchantShell changes:**

- Same structural pattern as AdminShell
- Preserve nested CRM / Catalog / Inventory submenus via `SidebarMenuSub` (ui-spec sidebar submenu pattern)
- Preserve `lowStockAlertCount` badge on Inventory → Alerts child link
- **Add nav entry:** Orders → `/orders` (Workstream B4)

**Accessibility (US-A6):** Sidebar transitions use `motion-reduce:transition-none` / disable width animation when `prefers-reduced-motion: reduce` — apply in copied sidebar CSS or Tailwind classes per design-system rules.

**App integration:** `AdminShellWrapper` / `MerchantShellWrapper` in each app remain thin — pass `userEmail`, `onLogout`, `businessName`, `lowStockAlertCount`; no route changes.

---

## Workstream B — Gap Closure

### B1. Checkout path fix (G-5)

**Bug:** `checkout-form.tsx` calls `apiFetch('/store/checkout', …)` — API route is slug-scoped.

**Correct path:** `POST /api/v1/store/:slug/checkout`

**Fix:**

```typescript
// apps/store/app/s/[slug]/checkout/_components/checkout-form.tsx
await apiFetch(
  storePath(storeSlug, 'checkout'),
  { method: 'POST', body: JSON.stringify({ guestEmail: email }) },
  { storeSlug, token },
);
```

**Request body:** `CheckoutRequest` — `{ guestEmail?: string }` (omit `createAccount` until backend supports it; field is currently ignored by `CheckoutDto`).

**Response:** `CheckoutResponse` from `@meridian/shared` — redirect to order confirmation or `/s/[slug]/account` after success; surface API error message inline.

**Post-checkout (test):** Call `POST /api/v1/store/:slug/orders/:orderId/simulate-payment` in dev/test flows if payment UI not wired (non-goal G-9).

---

### B2. Guest cart session — `X-Cart-Session` via localStorage (G-6)

#### Session lifecycle

| Concern | Decision |
|---------|----------|
| Generation | Client-side `crypto.randomUUID()` on first cart mutation or explicit `getOrCreateCartSession(slug)` |
| Persistence | `localStorage` key `meridian:cart-session:{slug}` (`cartSessionStorageKey` in `@meridian/shared`) |
| Scope | Per store slug (tenant isolation on client) |
| Cross-tab | Same slug shares session via localStorage |
| Authenticated user | Do **not** send `X-Cart-Session` when JWT present (API uses `customerId`) |
| Guest → login merge | **Implicit via API:** if client sends `X-Cart-Session` on first authenticated cart request, `StoreCartService.resolveCart` attaches `sessionId` to customer cart. Show toast: "Cart merged" on first post-login cart load when session existed. No new API. |

#### New store client module

**File:** `apps/store/lib/cart-session.ts`

```typescript
import { cartSessionStorageKey, CART_SESSION_HEADER } from '@meridian/shared';

export function getOrCreateCartSession(storeSlug: string): string;
export function clearCartSession(storeSlug: string): void;
export function getCartSessionHeaders(storeSlug: string, token?: string): Record<string, string>;
```

#### `apiFetch` extension

**File:** `apps/store/lib/api.ts`

```typescript
export interface StoreFetchContext {
  storeSlug: string;
  token?: string;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  ctx?: string | StoreFetchContext, // string = legacy token-only calls
): Promise<T>;
```

**Behavior:**

1. If `ctx` is `string`, treat as `token` (backward compatible).
2. If `ctx` is `StoreFetchContext` and `!ctx.token`, inject `X-Cart-Session: getOrCreateCartSession(ctx.storeSlug)`.
3. If `ctx.token`, set `Authorization: Bearer …` only.

**Call sites to update:** All cart/checkout `apiFetch` and `storePath` usages in `apps/store` — product detail add-to-cart, cart view PATCH/DELETE, checkout form, cart drawer if any.

#### Server Components (RSC) constraint

Guest cart **cannot** be read from `localStorage` in Server Components. Pattern:

| Page | Guest behavior |
|------|----------------|
| Catalog / PDP | Cart badge optional; add-to-cart is client-side |
| `/cart`, `/checkout` | Server fetch cart only when `token` present; otherwise pass `cart={null}` and hydrate via client `GuestCartLoader` that fetches with session header |
| Authenticated | Existing server `apiFetch(..., token)` unchanged |

**New client component:** `apps/store/components/guest-cart-loader.tsx` — fetches cart on mount, renders children with cart state or skeleton.

---

### B3. Admin reject DTO alignment (G-1) — UI only

**API contract (unchanged):**

```
POST /api/v1/platform/merchants/:id/reject
Body: RejectMerchantRequest { reason: string }  // min 3 chars
```

**Shared type:** `@meridian/shared` → `RejectMerchantRequest`

**Admin app fixes** (no API change):

| File | Change |
|------|--------|
| `apps/admin/app/merchants/[id]/_components/merchant-detail.tsx` | `{ reason }` not `{ rejectionReason }` |
| `apps/admin/app/merchants/_components/merchants-table.tsx` | same |
| `apps/admin/lib/api.ts` | Type reject body as `RejectMerchantRequest` |

**Display:** Response field remains `rejectionReason` on merchant entity — only request body field name changes. Label copy "Rejection reason" may stay user-friendly (PRD open Q10).

**Validation:** Client-side min 3 characters before submit (matches `RejectMerchantDto`).

---

### B4. Merchant orders page (G-11)

#### Routes (new)

| Route | Component | Data |
|-------|-----------|------|
| `apps/merchant/app/orders/page.tsx` | Orders list table | `GET /merchant/orders` |
| `apps/merchant/app/orders/[id]/page.tsx` | Order detail | `GET /merchant/orders/:id` |

**Nav:** Add `{ href: '/orders', label: 'Orders', icon: IconReceipt }` to `MerchantShell` main nav (between Catalog and Distributors or after Catalog).

#### API contracts

**List — `GET /api/v1/merchant/orders`**

- Auth: `MerchantAuthGuard` (JWT `aud: merchant`, `tenantId` scoped)
- Response: `MerchantOrderListItem[]` (see `@meridian/shared`)

```typescript
// Response shape (array, not paginated — MVP)
[
  {
    id: string;
    status: OrderStatus;
    total: Decimal;        // serialized as string | number in JSON
    currency: string;
    guestEmail: string | null;
    createdAt: ISO8601;
    customer: { id, email, firstName, lastName } | null;
    lines: [{ productName, variantName, quantity, lineTotal, ... }];
    commissionEntry?: { ... };
  }
]
```

**Detail — `GET /api/v1/merchant/orders/:id`**

- Response: `MerchantOrderDetail` — includes `lines[].variant`, `distributor`, `commissionEntry`
- 404 if order not in tenant scope

#### UI module boundary

```
apps/merchant/
  app/orders/
    page.tsx                          # Server: fetch list, pass to table
    [id]/page.tsx                     # Server: fetch detail
    _components/
      orders-table.tsx                # DataTable: id, status badge, total, createdAt
      order-detail-view.tsx           # Lines table, customer/guest email, status
  lib/api.ts                          # Add merchantOrder types / fetch helpers
```

**Empty state:** `@meridian/ui` `EmptyState` — "No storefront orders yet"

**Detail scope:** Include list + detail in same delivery (API exists; low incremental cost).

---

### B5. CRM activities UI (G-10, Phase 1 US-7)

#### Routes

| Route | Purpose | API |
|-------|---------|-----|
| `apps/merchant/app/crm/contacts/[id]/page.tsx` | Contact detail + activity timeline | `GET /merchant/crm/contacts/:id` (existing) + activities filtered client-side |
| `apps/merchant/app/crm/leads/[id]/page.tsx` | Lead detail + activity timeline | `GET /merchant/crm/leads/:id` (existing) + activities filtered client-side |
| `apps/merchant/app/crm/activities/page.tsx` | Global activity log (optional P1) | `GET /merchant/activities` |

**Nav (optional):** Add "Activities" under CRM submenu → `/crm/activities`.

#### API contracts

**List — `GET /api/v1/merchant/activities`**

- Response: `CrmActivity[]` ordered by `createdAt desc`
- Includes `contact` relation when `contactId` set; `leadId` only on record (no lead include today — display lead via separate lookup or ID)

**Create — `POST /api/v1/merchant/activities`**

```typescript
// CreateActivityRequest
{
  type: 'CALL' | 'NOTE' | 'MEETING';
  note: string;          // min 1 char
  contactId?: string;    // exactly one of contactId | leadId required (enforce in UI)
  leadId?: string;
}
```

**Delete — `DELETE /api/v1/merchant/activities/:id`**

- Response: `{ deleted: true }` (hard delete — matches API)
- UI: `AlertDialog` confirm before delete

#### Shared component

**Location:** `apps/merchant/app/crm/_components/activity-timeline.tsx` (app-local; CRM-specific)

**Props:**

```typescript
interface ActivityTimelineProps {
  contactId?: string;
  leadId?: string;
  initialActivities?: CrmActivity[];
}
```

**Data flow:**

1. On mount, `GET /merchant/activities` (or reuse server-fetched list)
2. Filter: `a.contactId === contactId || a.leadId === leadId`
3. Create form: `POST` with bound `contactId` or `leadId`
4. Delete: `DELETE /:id` → optimistic remove from timeline

**Permissions:** Same as other CRM writes — `MERCHANT_OWNER` and `MERCHANT_STAFF` via existing `MerchantAuthGuard`.

**Contact/lead list tables:** Add row link to detail pages (`/crm/contacts/[id]`, `/crm/leads/[id]`).

---

## API Contracts Summary

| Method | Path | Auth | Request | Response | Change |
|--------|------|------|---------|----------|--------|
| POST | `/platform/merchants/:id/reject` | Platform JWT | `{ reason: string }` | Merchant profile | None |
| GET | `/merchant/orders` | Merchant JWT | — | `MerchantOrderListItem[]` | None |
| GET | `/merchant/orders/:id` | Merchant JWT | — | `MerchantOrderDetail` | None |
| GET | `/merchant/activities` | Merchant JWT | — | `CrmActivity[]` | None |
| POST | `/merchant/activities` | Merchant JWT | `CreateActivityRequest` | `CrmActivity` | None |
| DELETE | `/merchant/activities/:id` | Merchant JWT | — | `{ deleted: true }` | None |
| GET | `/store/:slug/cart` | Guest header or Store JWT | Header: `X-Cart-Session` | Cart | None |
| POST | `/store/:slug/cart/items` | Guest header or Store JWT | `AddCartItemDto` | Cart | None |
| PATCH | `/store/:slug/cart/items/:id` | Guest header or Store JWT | `{ quantity }` | Cart | None |
| DELETE | `/store/:slug/cart/items/:id` | Guest header or Store JWT | — | Cart | None |
| POST | `/store/:slug/checkout` | Guest header or Store JWT | `{ guestEmail? }` | `CheckoutResponse` | None (client path fix only) |

---

## Data Model

**No Prisma migrations.** Existing models:

- `Order`, `OrderLine` — merchant orders UI
- `CrmActivity` — activities timeline (`contactId`, `leadId`, `type`, `note`)
- `Cart.sessionId` — guest cart keyed by `X-Cart-Session`
- `MerchantProfile.rejectionReason` — populated from reject `reason` DTO

---

## Module Boundaries

### `packages/ui`

| Addition | Purpose |
|----------|---------|
| `components/layouts/auth-layout.tsx` | login-03 auth frame |
| `components/ui/sidebar.tsx` | SidebarProvider primitive (from ui-spec) |
| `hooks/use-mobile.ts` | Sidebar mobile breakpoint |
| `components/shells/admin-shell.tsx` | Refactored to SidebarProvider |
| `components/shells/merchant-shell.tsx` | Refactored + Orders nav item |

### `packages/shared`

| File | Exports |
|------|---------|
| `platform.ts` | `RejectMerchantRequest` |
| `crm.ts` | `CrmActivity`, `CreateActivityRequest`, `DeleteActivityResponse` |
| `ecommerce.ts` | `MerchantOrderListItem`, `MerchantOrderDetail`, `CheckoutRequest/Response`, `cartSessionStorageKey`, `CART_SESSION_HEADER` |

### `apps/admin`

- Auth pages → `AuthLayout`
- Reject dialog/table → `{ reason }` body

### `apps/merchant`

- Auth pages → `AuthLayout`
- New: `app/orders/*`, `app/crm/contacts/[id]`, `app/crm/leads/[id]`, optional `app/crm/activities`
- CRM `_components/activity-timeline.tsx`

### `apps/store`

- Auth pages → `AuthLayout`
- `lib/cart-session.ts`, extended `lib/api.ts`
- Checkout path fix, guest cart headers on all cart/checkout calls
- `components/guest-cart-loader.tsx` for RSC pages

### `apps/api`

**No changes** for this initiative.

---

## Async Jobs

None introduced. Existing checkout flow continues to enqueue `order.confirmation` email via BullMQ after payment confirmation.

---

## Caching

None introduced. Guest cart session is client-side localStorage only — not Redis.

---

## Testing Map

| Story | Verification |
|-------|--------------|
| US-B1 | `e2e/phase-2-store.spec.ts` or Injectable checkout uses Injectable slug path; extend for UI guest flow |
| US-B2 | Assert `X-Cart-Session` on cart API calls; API e2e `store-checkout.e2e-spec.ts` remains green |
| US-B3 | Admin reject POST body `{ reason }`; existing `merchant-onboarding` e2e |
| US-B4 | Merchant orders list with seeded order |
| US-B5 | CRM e2e + Playwright smoke on activity create/delete on contact detail |
| US-A1–A6 | Visual/design review checklist; keyboard nav on sidebar |

**Suggested new spec:** `e2e/platform-gaps.spec.ts` for B P0 UI paths.

---

## ADRs

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| ADR-1 | Sidebar source for portals | Copy ui-spec `sidebar.tsx` → `packages/ui` | ui-spec is not a runtime dependency; established propagate workflow |
| ADR-2 | Shell refactor strategy | Full SidebarProvider restructure (not incremental wrap) | Achieves dashboard-01 structure; avoids dual collapse implementations |
| ADR-3 | Guest cart session storage | `localStorage` per slug + `X-Cart-Session` header | PRD requirement; aligns with API `GuestCartGuard` / header extraction; no cookie sync for MVP |
| ADR-4 | Guest cart on RSC pages | Client hydration via `GuestCartLoader` | localStorage unavailable server-side |
| ADR-5 | Guest → login cart merge | Implicit API merge + toast | No backend change; `StoreCartService` already links sessionId on auth |
| ADR-6 | Admin reject fix scope | UI request body only (`reason`) | API already correct; display field `rejectionReason` unchanged |
| ADR-7 | Merchant orders MVP | List + detail pages | `GET :id` exists; fulfills PRD row navigation |
| ADR-8 | CRM activities placement | Timeline on contact/lead detail + optional global list | US-7 audit trail on records; global route uses existing list API |
| ADR-9 | Activity delete | Hard delete + AlertDialog | Matches API; no soft-delete in schema |
| ADR-10 | Delivery sequencing | B P0 → A → B P1 | Smaller diffs first; shell refactor touches many files |
| ADR-11 | Store auth brand | Merchant `businessName` primary | Store has slug context; ui-designer can refine in design doc |

---

## Breaking Changes & Migration Risks

| Risk | Mitigation |
|------|------------|
| Shell refactor breaks all merchant/admin pages | Refactor shells in isolation; smoke-test every nav route |
| Sidebar CSS variables missing in portal globals | Copy sidebar tokens from ui-spec before shell swap |
| Guest cart SSR shows empty until hydrate | Accept flash or use skeleton in cart/checkout for guests |
| `apiFetch` signature change | Overload supports legacy `token` string arg |
| Contact/lead detail routes net-new | Link from existing tables; no URL breaking changes |

---

## Open Questions (resolved / deferred)

| PRD # | Resolution |
|-------|------------|
| 1 | **Resolved** — ADR-1/2: copy to packages/ui |
| 2 | **Deferred** — ui-designer: store brand mark (ADR-11 recommendation) |
| 3 | **Resolved** — ADR-3/4: localStorage + client hydration |
| 4 | **Resolved** — ADR-5: implicit merge + toast |
| 5 | **Resolved** — ADR-7: list + detail |
| 6 | **Resolved** — ADR-8: detail timeline + optional global route |
| 7 | **Resolved** — ADR-9: hard delete + confirm dialog |
| 8 | **Resolved** — ADR-10: B P0 first |
| 9 | **Deferred** — test-engineer: `platform-gaps.spec.ts` vs extend phase-2 |
| 10 | **Deferred** — ui-designer: display label copy |
