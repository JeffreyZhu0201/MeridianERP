# Handoff — platform-shadcn-blocks-framework (Architecture)

**Date:** 2025-06-25  
**Phase:** 2 — Architecture  
**Next agents:** ui-designer → nextjs-frontend + packages/ui implementation

## Handoff

- **Scope:** Architecture for platform-wide shadcn block page frameworks, theme system, ERP shell upgrade (sidebar-03), and named `*PageFrame` composites. UI-only — no API, Prisma, queue, or cache changes.
- **Files:**
  - `docs/architecture/platform-shadcn-blocks-framework.md`
  - Future implementation: `packages/ui/src/components/frameworks/`, `packages/ui/src/components/theme/`, `packages/ui/src/components/ui/sidebar.tsx`
  - Portal wiring: `apps/{admin,merchant,store}/app/layout.tsx`
- **Open questions:** None blocking — ui-designer may refine ModeToggle visual placement on store auth vs header.
- **Next agents:**
  1. **ui-designer** — `docs/design/platform-shadcn-blocks-framework.md` with ui-spec section anchors per FW-* ID
  2. **nextjs-frontend** — ui-spec showcase sections, then `packages/ui` composites, then portal route migration
  3. **test-engineer** — theme + shell smoke tests mapped to US-T1, US-F-SHELL, US-F-SPEC

## Key technical decisions

| Area | Decision |
|------|----------|
| **Theme** | `ThemeProvider` + `ModeToggle` in `@meridian/ui`; each portal `layout.tsx` wraps children with per-portal `storageKey` (`meridian-theme-admin` / `-merchant` / `-store`) |
| **Theme persistence** | localStorage via `next-themes` (P0); no SSR theme cookie |
| **Shell** | Replace `ShellFrame` with `ErpShell` on `SidebarProvider` stack; **sidebar-03** for merchant submenus; flat nav for admin |
| **Page chrome** | Named components: `ListPageFrame`, `DetailPageFrame`, `FormPageFrame`, `SettingsPageFrame`, `DashboardFrame`, `BindPageFrame`, `AuthStatusFrame` |
| **Store** | In-place `StoreShellFrame` (alias `StoreShell` temporarily) |
| **Icons** | Tabler in nav configs; Lucide in ModeToggle / sidebar chrome |

## Implementation order

1. **ui-spec showcase** — all FW-* sections in `apps/ui-spec/src/app/page.tsx` (gate)
2. **packages/ui primitives** — copy `sidebar.tsx`, theme components, missing ui primitives; extend `globals.css` sidebar tokens
3. **packages/ui frameworks** — `ErpShell`, `*PageFrame`, enhanced `AuthLayout`
4. **Portal theme** — wire `ThemeProvider` in all three `layout.tsx` files
5. **Portal routes (route-by-route)** — admin (8) → merchant (25) → store (9); auth → shell → lists → details → forms → settings/dashboard
6. **Deprecate** `ShellFrame` after shell migration complete

## Route framework quick reference

| Portal | Shell | Primary frames |
|--------|-------|----------------|
| admin | `AdminShell` → `ErpShell` | List, Detail, Dashboard, Settings, Auth |
| merchant | `MerchantShell` → `ErpShell` | List, Detail, Form, Dashboard, Settings, Auth, AuthStatus, Bind |
| store | `StoreShellFrame` | Auth, Form, Detail, Bind, AuthStatus |

## P0 stories for implementation mapping

- US-T1, US-F0, US-F-SHELL, US-F-SPEC
- US-F-ADM-AUTH, US-F-ADM-LIST, US-F-ADM-DETAIL
- US-F-MER-AUTH, US-F-MER-BIND, US-F-MER-LIST, US-F-MER-DETAIL, US-F-MER-FORM
- US-F-STORE-SHELL, US-F-STORE-AUTH, US-F-STORE-FORM
