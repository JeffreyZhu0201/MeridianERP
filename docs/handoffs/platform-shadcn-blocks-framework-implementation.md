# Handoff — platform-shadcn-blocks-framework (Phase 4 P0)

**Date:** 2025-06-25  
**Agent:** nextjs-frontend

## Scope

P0 framework foundation for shadcn blocks across `packages/ui`, portal theme wiring, ERP shell migration, minimal page frames, ui-spec showcase sections, and proof routes.

## Completed

### 1. Theme (`packages/ui`)

- `ThemeProvider`, `ModeToggle`, `PortalThemeProvider` in `packages/ui/src/components/theme/`
- Exported from `@meridian/ui`
- Per-portal `storageKey`: `meridian-theme-admin`, `meridian-theme-merchant`, `meridian-theme-store`

### 2. Portal theme wiring

- `apps/admin/app/layout.tsx` — `PortalThemeProvider` + `suppressHydrationWarning`
- `apps/merchant/app/layout.tsx` — same
- `apps/store/app/layout.tsx` — same

### 3. Sidebar + ErpShell

- `packages/ui/src/components/ui/sidebar.tsx` — sidebar-03 primitives (TW3-adapted from ui-spec)
- Supporting primitives: `sidebar-sheet`, `dropdown-menu`, `tooltip`, `separator`, `skeleton`, `breadcrumb`
- `packages/ui/src/components/frameworks/erp-shell.tsx` — `SidebarProvider` stack with `ModeToggle` in header
- `AdminShell` / `MerchantShell` refactored to `ErpShell` (merchant uses `SidebarMenuSub`)
- `ShellFrame` marked `@deprecated`
- Sidebar CSS tokens in `packages/ui/styles/globals.css`
- Sidebar Tailwind colors in portal `tailwind.config.ts`

### 4. Page frames (minimal)

- `ListPageFrame`, `DetailPageFrame`, `FormPageFrame`, `SettingsPageFrame` in `packages/ui/src/components/frameworks/`

### 5. Auth enhancement

- `AuthLayout` — `showThemeToggle` (default true), fixed top-right `ModeToggle`

### 6. ui-spec P0 showcase

- Sections in `apps/ui-spec/src/app/page.tsx`: `#framework-erp-shell`, `#framework-list-page`, `#framework-auth`, `#framework-detail-page`

### 7. Proof routes

| Portal | Route | Framework applied |
|--------|-------|-------------------|
| admin | `/login` | FW-AUTH via `AuthLayout` + theme toggle |
| admin | `/merchants` | FW-SHELL-ERP + `ListPageFrame` |
| merchant | `/login` | FW-AUTH via `AuthLayout` + theme toggle |
| merchant | `/` | FW-SHELL-ERP via `MerchantShell` → `ErpShell` |

## Files changed

```
packages/ui/package.json
packages/ui/styles/globals.css
packages/ui/src/index.ts
packages/ui/src/hooks/use-mobile.ts
packages/ui/src/components/auth-layout.tsx
packages/ui/src/components/theme/*
packages/ui/src/components/frameworks/*
packages/ui/src/components/ui/sidebar.tsx
packages/ui/src/components/ui/sidebar-sheet.tsx
packages/ui/src/components/ui/dropdown-menu.tsx
packages/ui/src/components/ui/tooltip.tsx
packages/ui/src/components/ui/separator.tsx
packages/ui/src/components/ui/skeleton.tsx
packages/ui/src/components/ui/breadcrumb.tsx
packages/ui/src/components/ui/button.tsx
packages/ui/src/components/shells/admin-shell.tsx
packages/ui/src/components/shells/merchant-shell.tsx
packages/ui/src/components/shells/shell-frame.tsx
apps/admin/app/layout.tsx
apps/admin/app/merchants/page.tsx
apps/admin/tailwind.config.ts
apps/merchant/app/layout.tsx
apps/store/app/layout.tsx
apps/ui-spec/src/app/page.tsx
```

## Dependencies added

- `@meridian/ui`: `next-themes`, `lucide-react`, `class-variance-authority`, `@base-ui/react`
- Portal apps: `next-themes` (peer via `@meridian/ui`)

## Build verification

- `pnpm --filter @meridian/ui build` — pass
- `pnpm --filter @meridian/admin build` — pass
- `pnpm --filter @meridian/merchant build` — pass

## Remaining for full route migration (~39 routes)

### P1 frameworks (not in this pass)

- `DashboardFrame`, `StoreShellFrame`, `BindPageFrame`, `AuthStatusFrame`
- ui-spec: `framework-dashboard`, `framework-form-page`, `framework-settings`, `framework-store-shell`, `framework-bind-card`, `framework-auth-status`

### Admin (6 routes)

- `/` — `DashboardFrame`
- `/merchants/[id]` — `DetailPageFrame`
- `/orders`, `/settlements` — `ListPageFrame`
- `/settings` — `SettingsPageFrame`
- `/inventory/tenants/[tenantId]` — `DetailPageFrame`

### Merchant (23 routes)

- All list routes → `ListPageFrame`
- Detail routes (`/distributors/[id]`, `/orders/[id]`, PO detail, CRM detail when shipped) → `DetailPageFrame`
- Form routes (PO new, adjustments form) → `FormPageFrame`
- `/settings`, `/inventory/settings` → `SettingsPageFrame`
- `/` — `DashboardFrame`
- Auth status: `/onboarding/pending` → `AuthStatusFrame`
- `/bind/[token]` → `BindPageFrame`
- `/register` — stable FW-AUTH outer frame

### Store (9 routes)

- `StoreShellFrame` + theme toggle in header
- FW-AUTH on slug login/register
- FW-STORE + list/detail/form on catalog/cart/checkout/account
- `/` landing → `AuthStatusFrame`

### Cleanup

- Remove `ShellFrame` after all shells migrated
- Migrate merchant table inline empty states to `ListPageFrame.emptyState`
- Playwright selector updates for new sidebar chrome
- Light/dark smoke on all routes

## Open questions

- None blocking P0 — architecture ADRs resolved in `docs/architecture/platform-shadcn-blocks-framework.md`

## Next agent

**test-engineer** — theme toggle + sidebar collapse smoke per portal; verify P0 acceptance criteria US-T1, US-F-SHELL, US-F-ADM-LIST, US-F-MER-AUTH.
