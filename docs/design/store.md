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
| `StoreCatalogHeader` | 8+4 title + metrics row |
| `StoreFeaturedHero` | Glass overlay featured product |
| `StoreCatalogToolbar` | “All Products” + filter/sort (visual) |
| `ProductCard variant="store"` | Catalog grid cards |
| `.store-bento-card` | Shared card shadow/border utility |

## Pages

| Route | Pattern |
|-------|---------|
| `/shop`, `/s/{slug}` | Header → Hero → Toolbar → Grid |
| `/shop/cart`, `/s/{slug}/cart` | Header metrics → card rows + sticky summary |
| PDP | 7+5 column, sticky details card |
| Checkout | (existing form; shell tokens inherited) |

## Accessibility

- Touch targets ≥44px on icon buttons and CTAs
- `prefers-reduced-motion`: bento hover lift disabled
- Filter/Sort toolbar disabled with `aria-disabled` until API exists
