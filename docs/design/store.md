# Store Portal — Design Spec

**Reference:** [`stich.md`](./stich.md) (HTML mockups)  
**Updated:** 2026-07-04  
**Scope:** `apps/store` consumer storefront only

## Theme

Store uses a **scoped M3-inspired palette** via `[data-portal="store"]` in `apps/store/app/globals.css`. Admin/merchant ERP tokens are unchanged.

| Token | Light | Usage |
|-------|-------|--------|
| Primary | `#4648d4` | Brand, prices, CTAs |
| Background | `#f9f9ff` | Page canvas |
| Primary container | `#6063ee` | Accent metric tiles |
| Tertiary | `#b61722` | Cart badge |

**Typography:** Inter (`next/font/google`) on store layout only.

## Layout

| Element | Spec |
|---------|------|
| Max width | `max-w-7xl` (1280px) |
| Header height | `h-20` sticky |
| Horizontal padding | `px-4 md:px-12` |
| Section gap | `gap-6` (24px) |

## Components (`@meridian/ui`)

| Component | Purpose |
|-----------|---------|
| `StoreShell` | Nav, actions, footer |
| `StoreCheckoutShell` | Minimal checkout header (logo + secure badge) |
| `StoreCatalogHeader` | 8+4 title + metrics row |
| `StoreFeaturedHero` | Glass overlay featured product |
| `StoreCatalogToolbar` | Filter/sort via URL query params |
| `StoreAccountSidebar` | Account nav (Orders active; Addresses/Settings stubs) |
| `StoreAccountProfileHero` | Avatar initials, name, email |
| `StoreAccountOrderList` | Card-wrapped order history |
| `ProductCard variant="store"` | Catalog grid cards |
| `.store-bento-card` | Shared card shadow/border utility |

## Pages

| Route | Pattern |
|-------|---------|
| `/shop`, `/s/{slug}` | Header → Hero → Toolbar → Grid (filter/sort in URL) |
| `/shop/account` | Sidebar + profile hero + metrics + order list (branch from cookie) |
| `/shop/cart`, `/s/{slug}/cart` | Header metrics → card rows + sticky summary |
| `/shop/checkout`, `/s/{slug}/checkout` | `StoreCheckoutShell` + 7+5 form + sticky summary |
| PDP | 7+5 column, sticky details card |

## Catalog API

- Unified: `GET /store/catalog?fulfillment=&category=&inStock=&q=&sort=`
- Filters meta: `GET /store/catalog/filters?fulfillment=`
- Per-store: `GET /store/:slug/products?…` and `GET /store/:slug/products/filters`

Sort values: `newest`, `name_asc`, `price_asc`, `price_desc`.

## Accessibility

- Touch targets ≥44px on icon buttons and CTAs
- `prefers-reduced-motion`: bento hover lift disabled
- Filter/Sort dropdowns keyboard-accessible via `@meridian/ui` menu primitives
