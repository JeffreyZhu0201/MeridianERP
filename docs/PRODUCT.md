# MeridianERP Product State

**Version:** 1.0.1  
**Updated:** 2026-07-02  
**Status:** Phase 1-5 complete; UI consistency cleanup in progress.

## Status

MeridianERP is a multi-tenant ERP platform for factory HQ, branch merchants, B2B distributors, and consumer storefronts. The shipped platform covers authentication, CRM, merchant onboarding, QR binding, e-commerce, inventory, distributor commissions, allocation, fulfillment, funds views, platform CRM, and AI operations diagnosis.

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Auth, CRM, merchant onboarding, QR binding | Complete |
| Phase 2 | Storefront, checkout, commissions, settlement basics | Complete |
| Phase 3 | Inventory, warehouses, purchase orders, transfers | Complete |
| Phase 4 | Distributor portal and commission enhancements | Complete |
| Phase 5 | Distribution, allocation, funds, platform CRM, AI diagnosis | Complete |
| UI consistency | EmptyState, Alert, Tabs, shared surface cleanup | In progress |
| Settings | Platform and merchant settings, team management | Complete |

## Users And Portals

| User | App | Port | Primary jobs |
|---|---|---|---|
| Factory HQ | `apps/admin` | 3000 | Master SKU, allocation, approvals, CRM, funds, fulfillment |
| Branch merchant | `apps/merchant` | 3002 | Sales, CRM, inventory, pickup verification, funds, replenishment |
| Consumer | `apps/store` | 3003 | Browse, cart, checkout, pickup or delivery, order history |
| Distributor | `apps/distributor` | 3005 | Recruit branches, view performance, commissions, withdrawals |

All portals share the NestJS API in `apps/api` on port 3001.

## Core Capabilities

- Authentication uses separate JWT audiences: `admin`, `merchant`, `store`, and `distributor`.
- Tenant isolation is enforced with `tenantId` on merchant-owned data and guarded API access.
- Admin manages merchants, distributors, MasterSku catalog, allocations, delivery queue, platform CRM, and funds.
- Merchant manages CRM, inventory, orders, pickup verification, funds, replenishment, and settings.
- Store supports catalog browsing, cart, Stripe checkout, account orders, pickup, delivery, and QR attribution.
- Distributor portal supports invite-based branch recruitment, performance views, commission ledger, and withdrawals.

## Business Rules

- Merchant onboarding: `DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED` or `REJECTED`; login is blocked until approval.
- CRM pipeline: `NEW -> QUALIFIED -> WON` or `LOST`; activity types include `CALL`, `NOTE`, and `MEETING`.
- QR binding uses HMAC-signed JWTs with `distributorId`, `tenantId`, `bindType`, and `exp`; default expiry is 7 days.
- Distributor commission is attributed through `MerchantProfile.recruitedByDistributorId`.
- Commission is accrued when an order reaches `FULFILLED` through pickup verification or HQ delivery shipping.
- Commission balance equals settled commission minus approved withdrawals.
- Pickup orders deduct branch inventory only when verified.
- Delivery orders enter the HQ delivery queue and deduct MasterSku stock when shipped.

## Known Open Work

- Continue UI consistency cleanup across shared states and portal surfaces.
- Keep `docs/architecture/system-overview.md` current with shipped schema and module changes.
- Add feature-specific PRD, architecture, and design docs before new feature implementation.
- Simplify repeated frontend API/auth/layout patterns and large mixed-responsibility components.
- Simplify backend pagination/list/date helpers and large inventory/distributor/fulfillment services.

## References

- Feature report: `docs/reports/功能报告.md`.
- Architecture overview: `docs/architecture/system-overview.md`.
- Design system: `docs/design/design-system.md`.
- Phase 5 PRD: `docs/prd/phase-5-distribution-and-allocation.md`.
- Phase 5 architecture: `docs/architecture/phase-5-distribution-and-allocation.md`.
- Execution workflow: `docs/execution/README.md`.
