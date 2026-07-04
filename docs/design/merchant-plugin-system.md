# Merchant Plugin System — Design Spec

**Updated:** 2026-07-04  
**Scope:** `apps/merchant` plugin marketplace, stub pages; `apps/admin` merchant plugin card; `@meridian/ui` MerchantShell nav filtering

## Screens

### 1. Plugin marketplace `/plugins`

**Frame:** `ListPageFrame` from `@meridian/ui/server`

**Layout:** Responsive grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`

**PluginCard** (compose with `Card`, `CardHeader`, `CardContent`, `Badge`, `Button`):
- Tabler icon (from catalog `icon` field)
- Title + description (i18n via `nameKey` / `descriptionKey`)
- Badge: Installed (secondary) when active
- Primary button: Install / outline Uninstall
- Non-owner: disabled buttons + `merchant.plugins.ownerOnlyHint`

**States:**
- Loading: skeleton cards
- Empty: `EmptyState` if catalog empty (unlikely)
- Error: `Alert` destructive
- Success: toast on install/uninstall; optional `?highlight=` scroll to card

**i18n:** `merchant.plugins.title`, `description`, `install`, `uninstall`, `installed`, `ownerOnlyHint`, per-plugin keys under `merchant.plugins.items.{code}.*`

### 2. Stub plugin pages `/hrm`, `/im`, etc.

**Frame:** `MerchantShell` + `EmptyState`

- Title: plugin name
- Description: `merchant.plugins.stubDescription`
- CTA: link to `/plugins`

### 3. Admin merchant detail — Plugins card

**Component:** `Card` inside existing detail grid

- Header: `admin.merchantPlugins.title`
- Body: flex wrap of `Badge` chips — green/outline for installed/not installed
- Subtext: installed timestamp when present

**States:** loading skeleton; error inline alert

**i18n:** `admin.merchantPlugins.*`

## MerchantShell changes

- Nav items with `pluginCode` filtered by `installedPluginCodes` prop
- CRM: `pluginCode: 'crm'` with existing children
- Stub plugins: top-level items (`hrm`, `im`, …) with single href
- New nav item: `plugins` marketplace (`IconPuzzle`), always visible, no pluginCode
- Core modules: no `pluginCode`

## Accessibility

- Install/Uninstall buttons min-h-11
- `aria-pressed` on installed badge context
- Stub EmptyState CTA is a link with visible focus

## Responsive

- Marketplace single column on mobile
- Admin plugin badges wrap on narrow screens
