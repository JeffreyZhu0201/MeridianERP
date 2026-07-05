# Admin Platform RBAC — Architecture

**Updated:** 2026-07-05  
**Status:** Shipped  
**Contracts:** `packages/shared/src/admin-rbac.ts`

## Overview

Platform admin (`apps/admin`) uses role-based access control (RBAC) with four fixed roles. Navigation, middleware route guards, and API `PlatformRolesGuard` enforce the same permission matrix.

## Roles

| Role | Code | Home route | Purpose |
|------|------|------------|---------|
| 超级管理员 | `SUPER_ADMIN` | `/` | Full platform control |
| 财务 | `FINANCE` | `/funds` | Funds KPIs, withdrawal approval, commission settlement |
| 发货员 | `FULFILLMENT` | `/allocations` | Delivery shipping, branch procurement shipping, orders |
| 审核员 | `REVIEWER` | `/merchants` | Merchant onboarding, procurement review, withdrawal list (read-only approve) |

`PLATFORM_OPS` was replaced by the scoped roles above (Prisma `PlatformRole` enum).

## Permissions

| Permission | SUPER_ADMIN | FINANCE | FULFILLMENT | REVIEWER |
|------------|:-----------:|:-------:|:-----------:|:--------:|
| dashboard | ✓ | ✓ | ✓ | ✓ |
| users | ✓ | | | |
| admins | ✓ | | | |
| merchants | ✓ | | | ✓ |
| inventory | ✓ | | | |
| distributors | ✓ | | | |
| orders | ✓ | | ✓ | |
| allocations | ✓ | | ✓ | |
| procurement | ✓ | | ✓ | ✓ |
| withdrawals | ✓ | ✓ | | ✓ |
| funds | ✓ | ✓ | | |
| settlements | ✓ | ✓ | | |
| settings | ✓ | | | |

`settlements` permission gates the **结算批次** section on `/withdrawals` (`#settlements`) and `platform/settlements/*` APIs. `/settlements` redirects to `/withdrawals#settlements`.

The **CRM** sidebar group shows children filtered by permission: `users`, `merchants`, `distributors`. There is no separate `crm` permission.

Source: `ADMIN_ROLE_PERMISSIONS` in `@meridian/shared`.

## Navigation vs permissions

| UI | Routes | Permission |
|----|--------|------------|
| CRM → 用户 | `/users` | `users` |
| CRM → 商户 | `/merchants` | `merchants` |
| CRM → 拓店员 | `/distributors` | `distributors` |
| 库存 | `/inventory`, `/inventory/*` | `inventory` |
| 配送发货 | `/allocations` | `allocations` |
| 分店进货 | `/procurement` | `procurement` |
| 拓店分润 | `/withdrawals`, `/settlements` (redirect) | `withdrawals` |
| 结算批次 section | `/withdrawals#settlements` | `settlements` |
| 资金 | `/funds`, `/funds/*` | `funds` |

## Enforcement layers

### Frontend middleware

`apps/admin/middleware.ts`:

- Requires `admin_token` cookie on non-public routes
- Reads `admin_role` cookie (default `SUPER_ADMIN` if missing)
- Redirects to role home when path is not allowed (`adminCanAccessPath`)

### Server pages

- `requireAdminSession()` — validates token via `GET /platform/auth/me`
- `requireToken()` — same validation for API-backed pages
- Invalid sessions redirect to `/api/auth/logout` to clear stale cookies

### API

- `PlatformAuthGuard` — JWT audience `admin`
- `PlatformRolesGuard` + `@PlatformRoles(...)` — endpoint-level role checks
- `GET /platform/auth/me` — returns `{ id, email, role, permissions, homePath }`
- Withdrawal approve/reject: `SUPER_ADMIN`, `FINANCE` only
- Settlement export: `SUPER_ADMIN`, `FINANCE` only
- Withdrawal list: `SUPER_ADMIN`, `FINANCE`, `REVIEWER`

## Admin management

Super admins manage platform users at `/admins`:

- CRUD platform admin accounts
- Assign one of the four roles
- Cannot delete self

## Seed accounts

After `pnpm db:seed`:

| Email | Password | Role |
|-------|----------|------|
| admin@meridian.test | admin123 | SUPER_ADMIN |
| finance@meridian.test | finance123 | FINANCE |
| fulfillment@meridian.test | fulfill123 | FULFILLMENT |
| reviewer@meridian.test | review123 | REVIEWER |

## Related docs

- [Product state](../PRODUCT.md) — current nav and routes
- [System overview](./system-overview.md)
- API e2e: `apps/api/test/platform-rbac.e2e-spec.ts`
