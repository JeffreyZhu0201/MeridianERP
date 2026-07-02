# Portal UI Fixes — i18n, Cart Session, Dark Mode Borders

**Date:** 2025-06-25  
**Branch:** `develop`  
**Status:** Implemented and verified (build + dev smoke)

## Summary

Three production-facing fixes shipped together with design-token polish and Phase 5 discovery docs:

| Area | Problem | Resolution |
|------|---------|------------|
| **i18n** | `ENVIRONMENT_FALLBACK` — `timeZone` missing in client `next-intl` | Pass `timeZone` from server layouts through `PortalLocaleProvider` |
| **Store cart** | `next/headers` pulled into client bundle via `cart-session.ts` | Split into `.shared`, `.client`, `.server` modules |
| **Dark mode UI** | Borders too heavy on cards, inputs, shell dividers | Alpha hairline tokens + `ring-1 ring-foreground/10` surfaces |

Phase 5 distribution & allocation PRD is **documentation only** — no implementation in this change set.

---

## 1. i18n `timeZone` (all portals)

### Behavior

`next-intl` v3+ requires an explicit `timeZone` on `NextIntlClientProvider`. Without it, client components using `useFormatter()` or date formatting log `ENVIRONMENT_FALLBACK` and may format dates inconsistently.

### Implementation

- `packages/ui/src/components/theme/portal-locale-provider.tsx` — new required prop `timeZone`
- Each portal root layout (`apps/{admin,merchant,store,distributor}/app/layout.tsx`):
  - `const timeZone = await getTimeZone()`
  - `<PortalLocaleProvider … timeZone={timeZone}>`
- Each portal `i18n/request.ts` returns `timeZone: 'UTC'` (server source of truth)

### Verify

1. Start admin: `rtk pnpm dev:admin`
2. Open http://localhost:3000/login
3. DevTools console: no `ENVIRONMENT_FALLBACK` warnings
4. Toggle locale (EN ↔ 中文) and dark mode — shell renders without errors

---

## 2. Store guest cart session (client/server split)

### Behavior

Guest carts use a per-store session ID:

- **Client:** read/create UUID in `localStorage`, mirror to cookie for SSR
- **Server:** read session ID from cookie on cart/checkout pages

Previously a single `cart-session.ts` imported both `localStorage` and `next/headers`, so any client import chain (e.g. `api.ts` → `cart-session`) broke the Next.js build.

### Module layout

| File | Runtime | Exports |
|------|---------|---------|
| `apps/store/lib/cart-session.shared.ts` | universal | `cartSessionCookieName()` |
| `apps/store/lib/cart-session.client.ts` | client | `ensureCartSessionId()` |
| `apps/store/lib/cart-session.server.ts` | server | `getServerCartSession()` |

### Import map

- `lib/api.ts` → `cart-session.client`
- `app/s/[slug]/cart/page.tsx`, `checkout/page.tsx` → `cart-session.server`

### Verify

1. `rtk pnpm --filter @meridian/store build` — succeeds (no `next/headers` in client graph)
2. `rtk pnpm dev:store` — compiles without webpack errors
3. Manual (needs seeded store slug + API):
   - Visit `/s/{slug}/products/...`, add to cart
   - Open `/s/{slug}/cart` — line items load for guest session
   - Refresh page — cart persists (cookie + localStorage)

---

## 3. Dark mode border polish (shared UI)

### Behavior

Dark theme uses softer visual separation:

- **Dividers:** `--border` / `--sidebar-border` → `0 0% 100% / 0.08` (8% white alpha)
- **Form controls:** `--input` decoupled from border; `dark:bg-input/30` on inputs
- **Surfaces:** Card, Dialog, Sheet, Dropdown → `ring-1 ring-foreground/10` (no `border` + `shadow-sm` stack)
- **Shell headers/footers:** `border-border/50` hairlines

Light mode tokens unchanged.

### Key paths

- Tokens: `packages/ui/styles/globals.css`
- Components: `packages/ui/src/components/ui/*`, shells in `packages/ui/src/components/shells/`
- Portal Tailwind: `apps/{admin,merchant,store,distributor}/tailwind.config.ts` — `hsl(var(--border) / <alpha-value>)`
- Design reference: `docs/design/dark-mode-borders.md`
- Reference: `packages/ui` dark-mode tokens and border components

### Verify

1. `rtk pnpm --filter @meridian/ui build`
2. Toggle dark mode on showcase page
3. Check: cards, outline buttons, table rows, shell header divider — borders read as subtle hairlines, not bright gray boxes
4. Repeat on admin (`/login`) and merchant portals

---

## 4. Phase 5 PRD (future work)

Discovery artifacts only — **not implemented**:

| Doc | Purpose |
|-----|---------|
| `docs/prd/phase-5-distribution-and-allocation.md` | US-5.1–5.18, release slices |
| `docs/prd/platform-overview.md` | v1.3 roadmap row |
| `docs/handoffs/phase-5-discovery.md` | Handoff to **architect** |

Next workflow step: `docs/architecture/phase-5-distribution-and-allocation.md`.

---

## Build & test checklist

```bash
rtk pnpm --filter @meridian/admin build
rtk pnpm --filter @meridian/merchant build
rtk pnpm --filter @meridian/store build
```

| Check | Expected |
|-------|----------|
| Admin build | ✓ |
| Store build | ✓ (no cart-session client/server leak) |
| Admin dev console | No `ENVIRONMENT_FALLBACK` |
| Store dev | Ready on :3003 |
| Dark mode ui-spec | Borders section matches portals |

---

## Related docs

- Design system: `docs/design/design-system.md`
- Dark mode borders: `docs/design/dark-mode-borders.md`
- Phase 5 PRD: `docs/prd/phase-5-distribution-and-allocation.md`
