# MeridianERP Product State

**Version:** 1.0.5  
**Updated:** 2026-07-04  
**Status:** Phase 1–5 complete; admin RBAC and platform polish shipped.

## Status

MeridianERP is a multi-tenant ERP platform for factory HQ, branch merchants, B2B distributors, and consumer storefronts. The shipped platform covers authentication, CRM, merchant onboarding, QR binding, e-commerce, inventory, distributor commissions, allocation, fulfillment, funds views, platform CRM, flagship unified store, admin multi-role RBAC, and AI operations diagnosis.

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Auth, CRM, merchant onboarding, QR binding | Complete |
| Phase 2 | Storefront, checkout, commissions, settlement basics | Complete |
| Phase 3 | Inventory, warehouses, purchase orders, transfers | Complete |
| Phase 4 | Distributor portal and commission enhancements | Complete |
| Phase 5 | Distribution, allocation, funds, platform CRM, AI diagnosis | Complete |
| Admin RBAC | Four platform roles with scoped nav and API guards | Complete |
| Flagship store | Unified catalog at `/shop`, branch fulfillment selector | Complete |
| Merchant plugin system | Plugin marketplace, CRM + extension modules per tenant | Complete |
| Platform admin polish | Inventory index, CRM detail pages, order ship, filters | Complete |
| UI consistency | EmptyState, Alert, Tabs, Bento shells, design-system alignment | Complete |
| Settings | Platform and merchant settings, team management | Complete |

## Users And Portals

| User | App | Port | Primary jobs |
|---|---|---|---|
| Factory HQ | `apps/admin` | 3000 | Master SKU, allocation, approvals, CRM, funds, fulfillment (role-scoped) |
| Branch merchant | `apps/merchant` | 3002 | Sales, CRM, inventory, pickup verification, funds, replenishment |
| Consumer | `apps/store` | 3003 | Browse unified catalog, cart, checkout, pickup or delivery, order history |
| Sales promoter (拓店员) | `apps/distributor` | 3005 | Recruit branches via share code, view promoted stores, commissions, withdrawals |

All portals share the NestJS API in `apps/api` on port 3001.

## Core Capabilities

- Authentication uses separate JWT audiences: `admin`, `merchant`, `store`, and `distributor`.
- **Admin RBAC:** Four roles — `SUPER_ADMIN`, `FINANCE`, `FULFILLMENT`, `REVIEWER` — with scoped navigation, middleware, and API guards. See `docs/architecture/admin-rbac.md`.
- Tenant isolation is enforced with `tenantId` on merchant-owned data and guarded API access.
- Admin manages merchants, distributors, MasterSku catalog, allocations, delivery queue, platform CRM, funds, and platform admins (`/admins`).
- Merchant manages CRM, inventory, orders, pickup verification, funds, replenishment, and settings.
- Store supports unified flagship catalog at `/shop`, header branch selector, cart, Stripe checkout, account orders, pickup, and delivery (no customer–distributor binding).
- Sales promoters (platform `Distributor`) recruit branches via store-portal share links, self-service invite codes/QR on `apps/distributor`, performance views, commission ledger, and withdrawals.
- Store open-shop flow (`/open-shop?invite=`) lets registered users apply to become branch owners; HQ approves in admin.
- HQ withdrawal approval confirms disbursement (`APPROVED` + `reviewedAt`); no third-party payout integration in P0.

## Business Rules

- **Unified platform accounts:** End users register via the store portal (`/register`); credentials live on `PlatformAccount`. Merchant owners assigned by admin or self-service use the same email/password for merchant login.
- **Admin merchant creation:** Platform admins can create merchants at `/merchants/new`, assign a registered user as `MERCHANT_OWNER`, and skip approval when `autoApprove` is used (default). Self-service merchant registration remains available at `/merchant/register`.
- **Admin user directory:** Platform admins can view all `PlatformAccount` records and computed identity tags at `/users`.
- Merchant onboarding: `DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED` or `REJECTED`; login is blocked until approval (self-service path). Admin-created merchants start `APPROVED`.
- CRM pipeline: `NEW -> QUALIFIED -> WON` or `LOST`; activity types include `CALL`, `NOTE`, and `MEETING`.
- **Sales promoters (拓店员):** Platform-level `Distributor` records (`tenantId: null`); may link to `PlatformAccount` via `accountId`. Admins create promoters from existing users and set `commissionRate`.
- **Branch recruitment:** Share link `{STORE_APP_URL}/open-shop?invite={CODE}` (admin or promoter portal self-service) or admin direct create with `recruitedByDistributorId`. Binding stored on `MerchantProfile.recruitedByDistributorId`.
- **Promoter commission:** Accrued when a branch's **allocation order** reaches `CONFIRMED` — **only for the 1st and 2nd** commissionable allocations per recruited branch (`commissionSource=ALLOCATION`). Base = wholesale total of that allocation × promoter rate. Retail order fulfillment does **not** accrue new commission.
- **Pickup margin:** Branch online pickup gross profit = order total minus wholesale cost snapshot on order lines (`unitWholesalePrice` at checkout).
- **Flagship catalog:** Admin MasterSku defines wholesale, suggested retail, and flagship selling price; flagship tenant catalog auto-syncs from HQ.
- **Unified store:** Consumers browse flagship catalog at `/shop`; header dropdown selects fulfillment branch (inventory and branch price apply).
- **Branch pricing:** Selling price defaults to suggested retail on allocation; merchant may tune within `maxRetailPriceDeviationPercent` (default 10%).
- **Flagship store:** One branch marked `isFlagship`; remembered branch slug preferred in store header, else flagship default.
- **Checkout:** Store checkout requires `fulfillmentType` (`PICKUP` or `DELIVERY`). Flagship store orders are delivery-only; branch stores support pickup and delivery.
- Commission balance equals settled commission minus approved withdrawals.
- Pickup orders deduct branch inventory only when verified.
- Branch delivery orders are shipped by the merchant and deduct branch warehouse stock.
- Flagship delivery orders enter the HQ delivery queue and deduct MasterSku stock when shipped.

## Quality And Testing

| Layer | Command | Status |
|---|---|---|
| API e2e | `cd apps/api && rtk pnpm test:e2e` | 36 suites, 144 tests |
| Playwright UI | `rtk pnpm exec playwright install chromium && rtk pnpm test:e2e` | 18 tests (admin, store, merchant) |
| UX patterns | List/detail Bento frames, Toaster feedback, status i18n | See `docs/design/design-system.md` |
| Typecheck | `rtk pnpm typecheck` | Strict monorepo build |
| Next.js lint | `rtk pnpm --filter @meridian/admin --filter @meridian/merchant --filter @meridian/store --filter @meridian/distributor lint` | Flat ESLint config per app |

## Known Open Work

- Keep historical phase docs aligned when schema changes (prefer updating `system-overview.md` appendix).
- API package ESLint (`apps/api`) has legacy `@typescript-eslint/no-unsafe-*` debt — does not block runtime.
- Add feature-specific PRD, architecture, and design docs **before** new feature implementation.

## References

- Feature report: `docs/reports/功能报告.md`.
- Architecture overview: `docs/architecture/system-overview.md`.
- Admin RBAC: `docs/architecture/admin-rbac.md`.
- Flagship catalog: `docs/architecture/flagship-catalog-store.md`.
- Design system: `docs/design/design-system.md`.
- Phase 5 PRD: `docs/prd/phase-5-distribution-and-allocation.md`.
- Phase 5 architecture: `docs/architecture/phase-5-distribution-and-allocation.md`.
- Execution workflow: `docs/execution/README.md`.
