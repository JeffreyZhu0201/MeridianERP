# Handoff: Platform UI Blocks & Gap Closure — Implementation

## Scope

- **Workstream A:** `AuthLayout` (login-03), `ShellFrame` (dashboard-01 skeleton), upgraded `AdminShell`/`MerchantShell`, auth pages refreshed (admin, merchant, store login/register)
- **Workstream B P0:** Store checkout slug path, guest `X-Cart-Session` via cookie/localStorage, admin reject `{ reason }`
- **Workstream B P1:** Merchant `/orders` list + detail, CRM `/crm/activities` (US-7)

## Files

- `packages/ui/src/components/auth-layout.tsx`
- `packages/ui/src/components/shells/shell-frame.tsx`
- `packages/ui/src/components/shells/admin-shell.tsx`
- `packages/ui/src/components/shells/merchant-shell.tsx`
- `apps/store/lib/cart-session.ts`, `apps/store/lib/api.ts`
- `apps/admin/app/login/_components/login-form.tsx`
- `apps/merchant/app/login/page.tsx`, `register/_components/register-wizard.tsx`
- `apps/store/app/s/[slug]/login/page.tsx`, `register/page.tsx`, checkout/cart fixes
- `apps/admin/app/merchants/**` reject body fix
- `apps/merchant/app/orders/**`, `apps/merchant/app/crm/activities/**`

## Verification

- API e2e: **41 passed**

## Open questions

- Full `SidebarProvider` copy from ui-spec deferred; `ShellFrame` provides dashboard-01 layout pattern
- Store account / customer order history still stub

## Next agent

test-engineer (Playwright smoke), devops-engineer (CI)
