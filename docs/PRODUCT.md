# MeridianERP Product State

**Version:** 1.0.9  
**Updated:** 2026-07-05  
**Status:** Phase 1–5 complete; admin nav consolidated; branch downstream-distributor binding removed; HQ funds & withdrawal UX polished.

## Status

MeridianERP is a multi-tenant ERP platform for factory HQ, branch merchants, B2B distributors, and consumer storefronts. The shipped platform covers authentication, merchant CRM (plugin), merchant onboarding, e-commerce, inventory, HQ sales-promoter commissions (allocation-based), branch allocation, fulfillment, HQ funds views, flagship unified store, admin multi-role RBAC, and AI operations diagnosis.

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Auth, CRM, merchant onboarding | Complete |
| Phase 2 | Storefront, checkout, commissions, settlement basics | Complete |
| Phase 3 | Inventory, warehouses, purchase orders, transfers | Complete |
| Phase 4 | Distributor portal and commission enhancements | Complete |
| Phase 5 | Distribution, allocation, funds, AI diagnosis | Complete |
| Admin RBAC | Four platform roles with scoped nav and API guards | Complete |
| Flagship store | Unified catalog at `/shop`, branch fulfillment selector | Complete |
| Merchant plugin system | Plugin marketplace, CRM + extension modules per tenant | Complete |
| Platform admin polish | Inventory index, order ship, filters, consolidated nav | Complete |
| Admin funds & withdrawals UX | Five KPI drill-downs, workflow hints, unified filter toolbars | Complete |
| Promoter model simplification | Branch downstream-distributor binding & retail-order commission removed | Complete |
| UI consistency | EmptyState, Alert, Tabs, Bento shells, design-system alignment | Complete |
| Settings | Platform and merchant settings, team management | Complete |
| Branch procurement | HQ catalog purchase orders; legacy replenishment requests removed from product UX | Complete |

## Users And Portals

| User | App | Port | Primary jobs |
|---|---|---|---|
| Visitor / developer | `apps/landing` | 3004 | Product overview and portal navigation |
| Factory HQ | `apps/admin` | 3000 | CRM (users/merchants/promoters), master SKU & branch allocations, delivery shipping, branch procurement shipping, funds, withdrawal approval, fulfillment (role-scoped) |
| Branch merchant | `apps/merchant` | 3002 | Sales, CRM, inventory, pickup verification, HQ procurement (去进货), funds |
| Consumer | `apps/store` | 3003 | Browse unified catalog, cart, checkout, pickup or delivery, order history |
| Sales promoter (拓店员) | `apps/distributor` | 3005 | Recruit branches via share code, view promoted stores, commissions, withdrawals |

All portals share the NestJS API in `apps/api` on port 3001.

## Admin Navigation (HQ)

| Nav item | Route | Purpose |
|---|---|---|
| 仪表盘 | `/` | Platform dashboard |
| 管理员 | `/admins` | Platform staff accounts |
| **CRM** (group) | | |
| → 用户 | `/users` | Platform account directory |
| → 商户 | `/merchants` | Onboarding & merchant management |
| → 拓店员 | `/distributors` | Sales promoter management |
| 库存 | `/inventory` | Branch inventory index; link to master catalog |
| 主 SKU 与分店配货 | `/inventory/master-catalog` | MasterSku catalog & branch allocation orders |
| 订单 | `/orders` | All consumer orders (filters) |
| 配送发货 | `/allocations` | Flagship delivery queue — ship paid delivery orders |
| 分店进货 | `/procurement` | Paid branch purchase orders — HQ shipment |
| 提现审批 | `/withdrawals` | Promoter withdrawal approval **and** commission settlement export |
| 资金 | `/funds` | Five HQ financial KPIs with drill-down detail pages |
| 设置 | `/settings` | Platform settings |

Legacy routes redirect: `/replenishment` → `/procurement`; `/orders?tab=delivery` → `/allocations`; `/settlements` → `/withdrawals?tab=settlements`.

Platform CRM (`/crm/*`, `platform/crm/*`) was removed; merchant CRM remains a per-tenant plugin.

### HQ funds drill-down

| KPI | Detail route | API |
|---|---|---|
| 在库总成本 | `/funds/inventory-cost` | `GET /platform/funds/inventory-cost` |
| 预计利润 | `/funds/expected-profit` | `GET /platform/funds/expected-profit` |
| 商家进货销售额/利润 | `/funds/procurement` | `GET /platform/funds/procurement` |
| 分销员分润 | `/funds/commissions` | `GET /platform/funds/commissions` |
| 净利润 | `/funds/net-profit` | `GET /platform/funds/net-profit` |

Overview: `GET /platform/funds/overview` (period query params `from` / `to`). Metrics 1–2 are **live inventory snapshots**; metrics 3–5 follow the selected reporting period. Legacy `GET /platform/funds/summary` retained for e2e compatibility.

### Withdrawal approval tabs

| Tab | URL | Purpose |
|---|---|---|
| 提现审批 | `/withdrawals` (default) | Approve/reject promoter withdrawal requests |
| 佣金结算 | `/withdrawals?tab=settlements` | Export settlement batches; view commission ledger |

Header metrics on the approval tab always reflect global **PENDING** queue totals (not the active status filter).

## Core Capabilities

- Authentication uses separate JWT audiences: `admin`, `merchant`, `store`, and `distributor`.
- **Admin RBAC:** Four roles — `SUPER_ADMIN`, `FINANCE`, `FULFILLMENT`, `REVIEWER` — with scoped navigation, middleware, and API guards. See `docs/architecture/admin-rbac.md`.
- Tenant isolation is enforced with `tenantId` on merchant-owned data and guarded API access.
- Admin manages users, merchants, and promoters under the **CRM** nav group; MasterSku & branch allocations at `/inventory/master-catalog`; flagship delivery at `/allocations`; branch procurement shipping at `/procurement`; HQ funds at `/funds`; withdrawal approval at `/withdrawals`.
- Merchant manages CRM (plugin), inventory, orders, pickup verification, **HQ procurement** (`/inventory/procurement`), funds, and settings. **No** branch downstream-distributor management or customer QR binding UI.
- Store supports unified flagship catalog at `/shop`, header branch selector, cart, Stripe checkout, account orders, pickup, and delivery. **No** customer–distributor binding or cart distributor attribution.
- Sales promoters recruit branches via store-portal share links (`/open-shop?invite=`), self-service invite codes on `apps/distributor`, performance views, commission ledger, and withdrawals.
- HQ withdrawal approval confirms disbursement (`APPROVED` + `reviewedAt`); no third-party payout integration in P0.

## Business Rules

- **Unified platform accounts:** End users register via the store portal (`/register`); credentials live on `PlatformAccount`. Merchant owners assigned by admin or self-service use the same email/password for merchant login.
- **Admin merchant creation:** Platform admins can create merchants at `/merchants/new`, assign a registered user as `MERCHANT_OWNER`, and skip approval when `autoApprove` is used (default).
- **Admin user directory:** Platform admins can view all `PlatformAccount` records at `/users`.
- Merchant onboarding: `DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED` or `REJECTED`; login is blocked until approval (self-service path).
- Merchant CRM pipeline (plugin): `NEW -> QUALIFIED -> WON` or `LOST`; activity types include `CALL`, `NOTE`, and `MEETING`. No distributor field on CRM leads.
- **Sales promoters (拓店员):** Platform-level `Distributor` records (`tenantId: null`); may link to `PlatformAccount` via `accountId`. Distinct from removed branch downstream-distributor binding.
- **Branch recruitment:** Share link `{STORE_APP_URL}/open-shop?invite={CODE}` or admin direct create with `recruitedByDistributorId`.
- **Promoter commission (allocation-only):** Accrued when a branch's **allocation order** reaches `CONFIRMED` — **only for the 1st and 2nd** commissionable allocations per recruited branch (`commissionSource=ALLOCATION`). Base = wholesale total × promoter rate. **No** retail-order commission accrual or async commission queue.
- **Pickup margin:** Branch online pickup gross profit = order total minus wholesale cost snapshot on order lines.
- **Flagship catalog:** Admin MasterSku defines wholesale, suggested retail, and flagship selling price; flagship tenant catalog auto-syncs from HQ.
- **Checkout:** Flagship store orders are **delivery-only**; branch stores support pickup and delivery.
- **Branch procurement:** Merchant submits `BranchPurchaseOrder` at `/inventory/procurement`. After payment, HQ ships from `/procurement`. Merchant confirms receipt to update branch inventory.
- **HQ funds (`/funds`):** Five KPIs — (1) inventory cost on hand, (2) expected profit on stock, (3) branch procurement sales & profit, (4) promoter commissions, (5) net profit — each with a detail page. UI distinguishes snapshot vs period metrics; date range filter with quick **last 30 days** applies to metrics 3–5. Net profit detail shows grouped revenue / costs / result breakdown.
- **Withdrawal approval (`/withdrawals`):** Tab **提现审批** — status filter + promoter filter in a unified toolbar; workflow hint links to settlement when finance role present. Tab **佣金结算** — export settlement batches so accrued commissions become settled (FINANCE/SUPER_ADMIN). Promoters withdraw only settled balance.
- Commission balance equals settled commission minus approved withdrawals.
- Flagship delivery orders enter the HQ queue at `/allocations` and deduct MasterSku stock when shipped.

## Quality And Testing

| Layer | Command | Status |
|---|---|---|
| API e2e | `cd apps/api && rtk pnpm test:e2e` | 39 suites, 161 tests |
| Playwright UI | `rtk pnpm exec playwright install chromium && rtk pnpm test:e2e` | 18 tests (admin, store, merchant) |
| UX patterns | List/detail Bento frames, Toaster feedback, status i18n, accessible tab/filter toolbars | See `docs/design/design-system.md` |
| Typecheck | `rtk pnpm typecheck` | Strict monorepo build |
| Next.js lint | `rtk pnpm --filter @meridian/admin --filter @meridian/merchant --filter @meridian/store --filter @meridian/distributor lint` | Flat ESLint config per app |

## Known Open Work

- `ReplenishmentRequest` and `PlatformCrm*` Prisma tables remain for legacy data; APIs and UI removed.
- Phase 4 architecture docs still describe removed branch binding / QR flows; prefer this file for current promoter semantics.
- API package ESLint (`apps/api`) has legacy `@typescript-eslint/no-unsafe-*` debt.
- Historical phase docs may lag `PRODUCT.md`; prefer this file and `admin-rbac.md` for current nav semantics.
- Add feature-specific PRD, architecture, and design docs **before** new feature implementation.

## References

- Feature report: `docs/reports/功能报告.md`.
- Architecture overview: `docs/architecture/system-overview.md`.
- Admin RBAC: `docs/architecture/admin-rbac.md`.
- Admin nav consolidation handoff: `docs/handoffs/admin-nav-consolidation-implementation.md`.
- Remove branch distributors handoff: `docs/handoffs/remove-branch-distributors-implementation.md`.
- Flagship catalog: `docs/architecture/flagship-catalog-store.md`.
- Design system: `docs/design/design-system.md`.
- Sales promoter design: `docs/design/sales-promoter.md`.
- Execution workflow: `docs/execution/README.md`.
