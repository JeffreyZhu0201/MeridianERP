# MeridianERP Design System

**Reference:** [shadcn/ui](https://ui.shadcn.com/) dashboard blocks  
**Version:** 1.0  
**Date:** 2025-06-24

## Design Read

Multi-tenant B2B SaaS ERP for platform operators and merchants. Restrained professional dashboard language. Data-dense admin surfaces. Not marketing pages.

**Dials:** DESIGN_VARIANCE 5 | MOTION_INTENSITY 3 | VISUAL_DENSITY 7

---

## Typography

### Font Families

| Token | Font | Load method | Usage |
|-------|------|-------------|-------|
| `--font-sans` | Geist Sans | `next/font/local` or `geist` package | UI, body, tables, forms |
| `--font-mono` | Geist Mono | `next/font/local` or `geist` package | IDs, tokens, QR debug, numeric columns |

### Type Scale (ERP density)

| Role | Classes | Size |
|------|---------|------|
| Page title | `text-2xl font-semibold tracking-tight` | 24px |
| Section title | `text-lg font-medium` | 18px |
| Card title | `text-base font-medium` | 16px |
| Body | `text-sm` | 14px |
| Table header | `text-xs font-medium uppercase tracking-wide text-muted-foreground` | 12px |
| Table cell | `text-sm` | 14px |
| Caption / meta | `text-xs text-muted-foreground` | 12px |
| Mono code | `font-mono text-xs` | 12px |

### Line Height

- Body: `leading-relaxed` (1.625)
- Headings: `leading-tight` (1.25)
- Tables: `leading-normal` (1.5)

---

## Color Palette

### Semantic Tokens (shadcn CSS variables)

Define in `packages/ui/styles/globals.css` and import in each app.

#### Light Mode

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 221 83% 53%;
  --radius: 0.5rem;
}
```

#### Dark Mode

```css
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 240 4% 10%;
  --input: 240 4% 10%;
  --ring: 217 91% 60%;
  --sidebar-border: 240 4% 10%;
}
```

Dark mode borders use lower lightness (`10%`) than secondary surfaces (`15.9%`) so table rows, cards, and shell dividers read as soft gray rather than bright lines.

### Locale (i18n)

| Item | Value |
|------|-------|
| Locales | `en` (default), `zh-CN` |
| Storage | Cookie per portal: `meridian_locale_admin`, `meridian_locale_merchant`, `meridian_locale_store`, `meridian_locale_distributor` |
| Messages | `packages/shared/src/i18n/messages/{en,zh-CN}/` |
| UI toggle | `LocaleToggle` in ERP/Store shell header (left of `ModeToggle`); `AuthToolbar` on login/register |
| Library | `next-intl` — cookie locale, no URL prefix |

---

### Status Colors

| Status | Light | Dark | Usage |
|--------|-------|------|-------|
| Success | `text-emerald-600` / `bg-emerald-50` | `text-emerald-400` / `bg-emerald-950` | Approved, Won |
| Warning | `text-amber-600` / `bg-amber-50` | `text-amber-400` / `bg-amber-950` | Under review, pending |
| Error | `text-destructive` / `bg-destructive/10` | same | Rejected, Lost |
| Info | `text-primary` / `bg-primary/10` | same | New, informational |

### Onboarding Status Badges

| Status | Variant |
|--------|---------|
| DRAFT | `secondary` |
| SUBMITTED | `outline` |
| UNDER_REVIEW | `warning` (custom) |
| APPROVED | `success` (custom) |
| REJECTED | `destructive` |

---

## Spacing and Layout

### Spacing Scale

Use Tailwind defaults (4px base): `1, 2, 3, 4, 6, 8, 12, 16`

| Context | Spacing |
|---------|---------|
| Page padding | `p-6` |
| Section gap | `space-y-6` |
| Card padding | `p-4` or `p-6` |
| Form field gap | `space-y-4` |
| Table cell padding | `px-4 py-3` |
| Sidebar width | `16rem` expanded, `3rem` collapsed |

### Border Radius

| Element | Radius |
|---------|--------|
| Buttons | `rounded-full` (pill) |
| Cards, dialogs | `rounded-xl` (12px) |
| Inputs | `rounded-md` (8px) |
| Badges | `rounded-md` |

### Z-Index Scale

| Layer | Value |
|-------|-------|
| Base | 0 |
| Sticky header | 10 |
| Sidebar overlay (mobile) | 20 |
| Dropdown | 40 |
| Modal / sheet | 50 |
| Toast | 100 |

---

## Portal Shells

### AdminShell (`packages/ui/components/shells/admin-shell.tsx`)

```
┌─────────────────────────────────────────────────┐
│ [Logo] MeridianERP Admin    [Tenant ▼] [User ▼] │  ← Top bar (h-14)
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  Page content                        │
│          │  ┌─────────────────────────────────┐ │
│ Dashboard│  │ Page title          [Actions]   │ │
│ Merchants│  ├─────────────────────────────────┤ │
│ Settings │  │                                 │ │
│          │  │  Main content area              │ │
│          │  │                                 │ │
└──────────┴──┴─────────────────────────────────┴─┘
```

**Nav items (Phase 1):** Dashboard, Merchants, Settings

### MerchantShell (`packages/ui/components/shells/merchant-shell.tsx`)

```
┌─────────────────────────────────────────────────┐
│ [Logo] {businessName}              [User ▼]     │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  Page content                        │
│          │                                      │
│ Dashboard│                                      │
│ CRM      │  ├ Contacts                          │
│   Contacts│ ├ Companies                         │
│   Leads  │  └ Activities                        │
│ Distributors│                                    │
│ Settings │                                      │
└──────────┴──────────────────────────────────────┘
```

**Nav items (Phase 1):** Dashboard, CRM (Contacts, Companies, Leads), Distributors, Settings

### Bind Page (mobile-first, no sidebar)

Full-width centered card, max-w-md, large touch targets (min-h-11 buttons).

---

## shadcn Component Map

| UI need | shadcn component | Notes |
|---------|------------------|-------|
| Data tables | `Table` + `@tanstack/react-table` | Sticky header, row actions dropdown |
| Forms | `Form` + `Input`, `Select`, `Textarea` | React Hook Form + Zod |
| Modals | `Dialog` | Confirm approve/reject |
| Side panels | `Sheet` | Quick-view merchant detail |
| Status | `Badge` | Onboarding status, lead stage |
| Navigation | `Sidebar` | Collapsible, icon mode |
| Loading | `Skeleton` | Match table row height |
| Toasts | `Sonner` | Success/error feedback |
| Dropdowns | `DropdownMenu` | Row actions, user menu |
| Tabs | `Tabs` | CRM entity detail views |
| Empty state | Custom + `Button` | Icon + message + CTA |
| QR display | Custom + `Card` | QR image + copy link button |

### Install commands

```bash
npx shadcn@latest init
npx shadcn@latest add button card badge table form input select textarea dialog sheet sidebar skeleton sonner dropdown-menu tabs separator avatar
```

---

## Icons

- **Library:** `@tabler/icons-react`
- **Stroke:** 1.5 globally
- **Sizes:** `size-4` (16px) inline, `size-5` (20px) nav, `size-6` (24px) empty states

| Context | Icon |
|---------|------|
| Dashboard | `IconLayoutDashboard` |
| Merchants | `IconBuildingStore` |
| Contacts | `IconAddressBook` |
| Companies | `IconBuilding` |
| Leads | `IconTarget` |
| Distributors | `IconUsersGroup` |
| QR | `IconQrcode` |
| Settings | `IconSettings` |

---

## Motion

- **Intensity:** Low (MOTION_INTENSITY 3)
- Sidebar collapse: `transition-[width] duration-200 ease-out`
- Dialog/sheet: shadcn defaults
- No scroll hijacking, no parallax
- `prefers-reduced-motion`: disable all transitions

---

## Accessibility Checklist

- [ ] All form inputs have visible labels (not placeholder-only)
- [ ] Focus rings visible on all interactive elements
- [ ] Color contrast WCAG AA (4.5:1 body, 3:1 large text)
- [ ] Table headers use `<th scope="col">`
- [ ] Status not conveyed by color alone (badge text + color)
- [ ] Bind page buttons min 44px height
- [ ] Dark mode tested independently

---

## UI spec

Canonical component library: `apps/ui-spec/` (`@meridian/ui-spec`).  
Agents read `apps/ui-spec/src/app/page.tsx` and `src/components/ui/` before designing or implementing UI.  
Do not use Figma for this repo.
