# Handoff — platform-shadcn-blocks-framework (Discovery)

**Date:** 2025-06-25  
**Phase:** 1 — Product (PRD)  
**Next agent:** architect

## Handoff

- **Scope:** PRD for platform-wide shadcn block page frameworks and theme toggle across admin (8 routes), merchant (25 routes + 2 planned CRM detail), and store (9 routes). Supersedes Workstream A of `platform-ui-blocks-and-gaps.md` for framework scope; does not include Workstream B gap closure.
- **Files:** `docs/prd/platform-shadcn-blocks-framework.md`
- **Open questions:**
  1. ThemeProvider placement and SSR storage strategy
  2. sidebar-03 vs sidebar-07 canonical choice
  3. Named layout components vs composition recipes in `packages/ui`
  4. Store shell upgrade strategy (in-place vs v2)
  5. CRM detail routes sequencing vs Workstream B
  6. ui-spec → packages/ui → portals rollout order
  7. Coordination with in-flight `platform-ui-blocks-and-gaps` implementation
- **Next agent:** architect — define shared layout components, ThemeProvider wiring, and migration plan per portal

## Route → framework summary

| Portal | Routes | Primary frameworks |
|--------|--------|-------------------|
| admin | 8 | FW-SHELL-ERP, FW-AUTH, FW-LIST, FW-DETAIL, FW-DASHBOARD, FW-SETTINGS |
| merchant | 25 (+2 planned) | FW-SHELL-ERP, FW-AUTH, FW-AUTH-STATUS, FW-BIND, FW-LIST, FW-DETAIL, FW-FORM, FW-DASHBOARD, FW-SETTINGS |
| store | 9 | FW-STORE, FW-AUTH, FW-BIND, FW-FORM, FW-DETAIL, FW-AUTH-STATUS |

## P0 user stories

| ID | Title |
|----|-------|
| US-T1 | Theme toggle (light/dark/system) on all shells and auth pages |
| US-F0 | Documented page frameworks in packages/ui + ui-spec-first rule |
| US-F-SHELL | dashboard-01 / sidebar-03 ERP shell (admin + merchant) |
| US-F-ADM-AUTH | Admin login-03 + theme |
| US-F-ADM-LIST | Admin list framework (merchants, orders, settlements) |
| US-F-ADM-DETAIL | Admin detail framework (merchant, tenant inventory) |
| US-F-MER-AUTH | Merchant auth + onboarding frameworks |
| US-F-MER-BIND | Merchant QR bind mobile framework |
| US-F-MER-LIST | Merchant list framework (all list routes) |
| US-F-MER-DETAIL | Merchant detail framework |
| US-F-MER-FORM | Merchant form framework (PO new, adjustments) |
| US-F-STORE-SHELL | Store consumer shell + header theme toggle |
| US-F-STORE-AUTH | Store login-03 with store branding |
| US-F-STORE-FORM | Store checkout form framework |
| US-F-SPEC | ui-spec showcase for all framework IDs before portal merge |

## shadcn block references

- **Shell:** dashboard-01 Featured + sidebar-03 (sidebar-07 alternate)
- **Auth:** login-03
- **Tables/lists:** dashboard-01 data table section
- **Detail:** dashboard-01 cards + embedded table
- **Forms:** shadcn Card form patterns
- **Settings:** settings-style Card sections (new ui-spec section)
- **Store:** custom consumer header (not dashboard shell)
- **Bind:** login-03 simplified centered card

## Current state gaps

- `packages/ui` has partial `ShellFrame` (dashboard-01 skeleton) and `AuthLayout` (login-03) — no SidebarProvider stack, no ModeToggle export
- Portal apps lack `ThemeProvider` / `next-themes` wiring; ui-spec has both
- No shared ListPage / DetailPage / FormPage composites yet
- `StoreShell` has no theme toggle
