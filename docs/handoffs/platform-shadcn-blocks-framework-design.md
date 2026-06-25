# Handoff — Platform shadcn Blocks Framework (Design)

**Phase:** 3 — UI spec / design  
**Date:** 2025-06-25  
**Agent:** ui-designer  
**Next agent:** architect → ui-spec implementation → nextjs-frontend

---

## Scope

Design specification for reusable page frameworks (FW-*) mapped to shadcn blocks (dashboard-01, sidebar-03, login-03) across all 42+ portal routes. Includes:

- ASCII wireframes for all 10 framework types
- Per-portal route → framework → ui-spec mapping tables
- **ModeToggle** placement rules (ERP header right, auth/bind fixed top-right, store header)
- Light/dark token usage from `apps/ui-spec/src/app/globals.css`
- Prioritized list of new ui-spec showcase sections (implementation gate)

**Design doc:** `docs/design/platform-shadcn-blocks-framework.md`  
**PRD:** `docs/prd/platform-shadcn-blocks-framework.md`

---

## Ui-spec refs (existing showcase sections)

| Primitive need | Current `page.tsx` section |
|----------------|----------------------------|
| Buttons, CTAs | Buttons |
| Status cells | Badges |
| Tables | Data Table |
| Forms | Form Controls |
| Dialogs / confirm | Dialogs & Overlays |
| Tabs on detail | Tabs & Accordion |
| Loading / error | Feedback & Progress (Skeleton, Alert) |
| Toasts | Toast Notifications |
| Theme control | Page header `ModeToggle` (L177–179) |
| Sidebar primitives | `src/components/ui/sidebar.tsx` (not yet in page showcase) |

---

## Ui-spec sections to add (priority order)

Implement in this order — portal rollout is **blocked** until P0 sections exist:

| Order | Section anchor | Framework |
|-------|----------------|-----------|
| 1 | `framework-erp-shell` | FW-SHELL-ERP |
| 2 | `framework-list-page` | FW-LIST |
| 3 | `framework-auth` | FW-AUTH |
| 4 | `framework-detail-page` | FW-DETAIL |
| 5 | `framework-dashboard` | FW-DASHBOARD |
| 6 | `framework-form-page` | FW-FORM |
| 7 | `framework-settings` | FW-SETTINGS |
| 8 | `framework-store-shell` | FW-STORE |
| 9 | `framework-bind-card` | FW-BIND |
| 10 | `framework-auth-status` | FW-AUTH-STATUS |

---

## ModeToggle placement rules (summary)

| Surface | Placement |
|---------|-----------|
| FW-SHELL-ERP | Header far right, before user menu (`ml-auto` cluster) |
| FW-AUTH, FW-AUTH-STATUS | `fixed right-4 top-4 z-50` on muted canvas |
| FW-BIND | Same fixed top-right as auth |
| FW-STORE | Header right cluster, before cart icon |
| Store auth (`/s/[slug]/login`) | Fixed top-right on auth canvas only — **not** in store header |
| ui-spec | Page title row, right-aligned (existing) |

**Component source:** `apps/ui-spec/src/components/mode-toggle.tsx` → export from `packages/ui`.

**ThemeProvider:** `attribute="class"`, `defaultTheme="system"`, `enableSystem` per PRD US-T1.

---

## Files

| Path | Action |
|------|--------|
| `docs/design/platform-shadcn-blocks-framework.md` | **Created** — full design spec |
| `docs/handoffs/platform-shadcn-blocks-framework-design.md` | **Created** — this handoff |
| `apps/ui-spec/src/app/page.tsx` | **Next** — add framework sections P0–P2 |
| `apps/ui-spec/src/components/mode-toggle.tsx` | Reference — propagate to `packages/ui` |
| `apps/ui-spec/src/app/globals.css` | Token source — sync `packages/ui/styles` |
| `packages/ui/src/components/shells/*` | Migrate to SidebarProvider stack |
| `packages/ui/src/components/auth-layout.tsx` | Add `ModeToggle` slot + status variant |

---

## Design decisions made

1. **sidebar-03** over sidebar-07 for ERP nav (merchant nested groups).
2. **Store theme:** header toggle on FW-STORE routes; auth/bind use fixed canvas toggle (no duplicate).
3. **Icons:** Tabler in portal nav; Lucide in ui-spec and ModeToggle.

---

## Open questions (not design)

| # | Owner | Topic |
|---|-------|-------|
| 1 | architect | ThemeProvider location (app vs packages/ui) |
| 2 | architect | Theme persistence storage |
| 4 | architect | Named `ListPage` components vs recipes |
| 6 | architect | StoreShell in-place vs V2 |
| 7 | product | CRM detail framework timing |
| 8 | engineering | Per-portal vs big-bang rollout |

---

## Next agent

1. **architect** — `docs/architecture/platform-shadcn-blocks-framework.md` (ThemeProvider, component API, rollout sequence).
2. **nextjs-frontend** — After P0 ui-spec sections: implement framework composites in `packages/ui`, then migrate portal routes per design route tables.
