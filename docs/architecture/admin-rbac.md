# Admin Platform RBAC — Architecture

**Updated:** 2026-07-04  
**Status:** Shipped  
**Contracts:** `packages/shared/src/admin-rbac.ts`

## Overview

Platform admin (`apps/admin`) uses role-based access control (RBAC) with four fixed roles. Navigation, middleware route guards, and API `PlatformRolesGuard` enforce the same permission matrix.

## Roles

| Role | Code | Home route | Purpose |
|------|------|------------|---------|
| 超级管理员 | `SUPER_ADMIN` | `/` | Full platform control |
| 财务 | `FINANCE` | `/funds` | Withdrawals, funds, settlements |
| 发货员 | `FULFILLMENT` | `/orders` | Orders, allocations, replenishment fulfillment |
| 审核员 | `REVIEWER` | `/merchants` | Merchant onboarding, replenishment, withdrawal review |

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
| replenishment | ✓ | | ✓ | ✓ |
| withdrawals | ✓ | ✓ | | ✓ |
| funds | ✓ | ✓ | | |
| settlements | ✓ | ✓ | | |
| crm | ✓ | | | |
| settings | ✓ | | | |

Source: `ADMIN_ROLE_PERMISSIONS` in `@meridian/shared`.

## Enforcement layers

### Frontend middleware

`apps/admin/middleware.ts`:

- Requires `admin_token` cookie on non-public routes
- Reads `admin_role` cookie (default `SUPER_ADMIN` if missing)
- Redirects to role home when path is not allowed (`adminCanAccessPath`)

### Server pages

- `requireAdminSession()` — validates token via `GET /platform/auth/me`; redirects to login or logout on failure
- `requireToken()` — same validation for API-backed pages
- Invalid sessions redirect to `/api/auth/logout` to clear stale cookies

### API

- `PlatformAuthGuard` — JWT audience `admin`
- `PlatformRolesGuard` + `@PlatformRoles(...)` — endpoint-level role checks
- `GET /platform/auth/me` — returns `{ id, email, role, permissions }`

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

- [System overview](./system-overview.md) — platform auth appendix
- [Product state](../PRODUCT.md) — shipped capabilities
- API e2e: `apps/api/test/platform-rbac.e2e-spec.ts`
