# Admin Nav Consolidation — Implementation Handoff

**Phase:** Maintenance / polish  
**Updated:** 2026-07-05  
**Status:** Shipped in working tree (not committed unless requested)

## Summary

Consolidated Admin HQ navigation and aligned docs with code. No new product capabilities — route repurposing, UI merge, and metric drill-down refinement only.

## Changes

### 1. `/allocations` → 配送发货

- **Before:** Master SKU catalog + branch allocation orders
- **After:** Flagship delivery shipping queue (`deliveryQueue=true`)
- **Moved to:** `/inventory/master-catalog`

### 2. CRM nav group

- **Before:** Separate nav items for 用户/商户/拓店员 + platform CRM (`/crm/contacts|companies|leads`)
- **After:** Collapsible **CRM** group with 用户、商户、拓店员 only
- **Removed:** `apps/admin/app/crm/*`, `apps/api/src/platform/crm/*`, `packages/shared/src/phase-5-crm.ts`
- **Unchanged:** Merchant CRM plugin (`apps/merchant/app/crm/*`)

### 3. `/funds` — five KPIs

- **Before:** GMV / wholesale / commission liability dashboard
- **After:** Five metrics with detail pages:
  - `/funds/inventory-cost`
  - `/funds/expected-profit`
  - `/funds/procurement`
  - `/funds/commissions`
  - `/funds/net-profit`
- **API:** `GET /platform/funds/overview` + detail endpoints
- **Legacy:** `GET /platform/funds/summary` retained for e2e

### 4. `/withdrawals` + `/settlements` merge

- **Before:** Separate nav: 提现 + 结算
- **After:** Single **提现审批** nav with tabs:
  - `tab=approval` (default) — withdrawal queue
  - `tab=settlements` — commission export & ledger (FINANCE/SUPER_ADMIN)
- **Redirect:** `/settlements` → `/withdrawals?tab=settlements`

### 5. Branch procurement (prior session)

- Merchant replenishment UI/API removed; admin `/procurement` enhanced

## Docs updated

- `docs/PRODUCT.md` v1.0.8
- `docs/architecture/admin-rbac.md`
- `docs/design/sales-promoter.md`

## Code polish (this session)

- Funds procurement detail: period totals from `loadPeriodMetrics` (not current page only)
- Withdrawals header: pending count/amount always from global PENDING query

## Test plan

- [ ] `rtk pnpm typecheck`
- [ ] Admin: CRM group expands; children respect RBAC
- [ ] `/allocations` shows delivery queue; `/inventory/master-catalog` shows SKUs
- [ ] `/funds` five cards link to detail pages
- [ ] `/withdrawals` tabs; `/settlements` redirects
- [ ] `rtk pnpm test:e2e` in `apps/api` (platform-rbac, phase-5-platform funds summary)

## References

- Canonical product state: `docs/PRODUCT.md`
- RBAC matrix: `docs/architecture/admin-rbac.md`
