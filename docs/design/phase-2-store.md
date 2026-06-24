# Phase 2 — Consumer Store Design

**App:** `apps/store`  
**Port:** 3003  
**Shell:** `StoreShell`  
**Routing:** `/s/[slug]/...`

## Frames

| Frame | Route | Description |
|-------|-------|-------------|
| Home | `/s/[slug]` | Product grid |
| Product | `/s/[slug]/products/[productSlug]` | PDP with variant selector |
| Cart | `/s/[slug]/cart` | Line items + summary |
| Checkout | `/s/[slug]/checkout` | Email, address, Stripe Elements |
| Login | `/s/[slug]/login` | Customer login |
| Register | `/s/[slug]/register` | Customer register |
| Account | `/s/[slug]/account` | Order history |
| Bind | `/s/[slug]/bind/[token]` | Distributor QR claim (mobile-first) |

## Home (`/s/[slug]`)

| Element | Spec |
|---------|------|
| Header | StoreShell: business name, cart icon with count |
| Grid | Product cards: image placeholder, name, from-price |
| Empty | "No products yet" if catalog empty |

## Product Detail

| Element | Spec |
|---------|------|
| Layout | Image left / info right (stack on mobile) |
| Variants | Select or button group for SKU/price |
| CTA | "Add to cart" primary, disabled if out of stock |
| Stock | "In stock" / "Only N left" / "Out of stock" |

## Cart

| Element | Spec |
|---------|------|
| Table | Product, variant, qty stepper, line total, remove |
| Summary | Subtotal, sticky on mobile |
| CTA | "Checkout" full width |

## Checkout

| Element | Spec |
|---------|------|
| Guest | Email required; checkbox "Create account" |
| Payment | Stripe Payment Element embedded |
| Attribution | If distributor cookie present, show "Referred by {name}" |
| Success | Redirect to order confirmation page |

## Component Mapping

| UI element | Code path |
|------------|-----------|
| StoreShell | `packages/ui/components/shells/store-shell.tsx` |
| ProductCard | `packages/ui/components/product-card.tsx` |
| CartDrawer | `packages/ui/components/cart-drawer.tsx` (optional mobile) |

## Visual

- Reuse `packages/ui` tokens from `design-system.md`
- Consumer-facing: slightly more marketing polish than ERP dashboards (DESIGN_VARIANCE 6)
- Mobile-first bind page matches `phase-1-merchant.md` bind spec
