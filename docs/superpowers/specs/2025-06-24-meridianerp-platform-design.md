# MeridianERP Platform Design Specification

**Version:** 1.0  
**Date:** 2025-06-24  
**Status:** Approved for Phase 1 implementation

## 1. Executive Summary

MeridianERP is a **multi-tenant SaaS platform** combining ERP, CRM, merchant onboarding, distributor management, and (Phase 2+) integrated e-commerce. Three distinct portals share one NestJS API:

| Portal | Path | Audience | Phase |
|--------|------|----------|-------|
| Super Admin ERP | `apps/admin` | Platform operators | 1 |
| Merchant Backend | `apps/merchant` | Merchant staff | 1 |
| Consumer Store | `apps/store` | End customers | 2 |

**Phase 1 scope:** Authentication, RBAC, merchant onboarding, CRM core, distributor management, QR binding, profit-sharing settings (configuration only, no settlement).

## 2. Business Goals

- Enable platform operators to onboard and manage merchants at scale
- Give merchants a CRM to track leads, contacts, and distributor relationships
- Support distributor agents with QR-based binding for merchants and (Phase 2) customers
- Lay foundation for e-commerce with integrated commission tracking

## 3. Tenancy Model

- **Multi-tenant SaaS:** one platform instance serves many merchant organizations
- Each merchant is a `Tenant` with isolated data (`tenantId` on all merchant-owned rows)
- Platform users (`SUPER_ADMIN`, `PLATFORM_OPS`) operate cross-tenant with audit logging
- Merchant users are scoped to their `tenantId` via API guards

## 4. User Personas

| Persona | Portal | Primary tasks |
|---------|--------|---------------|
| Platform Super Admin | admin | Approve merchants, platform config, cross-tenant support |
| Platform Ops | admin | Merchant review, distributor oversight |
| Merchant Owner | merchant | Onboarding, CRM, distributor setup, staff management |
| Merchant Staff | merchant | CRM daily work, lead follow-up |
| Distributor Agent | merchant (limited) | View QR codes, commission settings, bound accounts |
| End Customer | store (Phase 2) | Browse, purchase, scan distributor QR |

## 5. Phase Roadmap

### Phase 1 — Foundation (current)

- Platform and merchant authentication (separate realms)
- Merchant self-registration and admin approval workflow
- CRM: companies, contacts, leads, activities
- Distributor CRUD with commission rate configuration
- QR code generation and binding claim flow
- Super admin and merchant portal UIs

### Phase 2 — E-commerce

- `apps/store` consumer storefront
- Product catalog, cart, checkout
- Customer registration/login
- Order → commission calculation
- Settlement ledger and payout workflow

### Phase 3 — Advanced ERP

- Inventory, warehousing, purchase orders
- Financial reporting, analytics dashboards
- Advanced distributor hierarchies

## 6. System Architecture

```
apps/admin/      → Super admin ERP (Next.js)
apps/merchant/   → Merchant portal (Next.js)
apps/store/      → E-commerce (Next.js, Phase 2)
apps/api/        → NestJS monolith API
packages/shared/ → DTOs, Zod schemas, enums
packages/ui/     → Shared shadcn shells, layout, data-table
docker/          → Compose: postgres, redis, api, admin, merchant
```

### Auth Realms

| Realm | JWT audience | Cookie prefix | Roles |
|-------|--------------|---------------|-------|
| platform | `admin` | `admin_` | SUPER_ADMIN, PLATFORM_OPS |
| merchant | `merchant` | `merchant_` | MERCHANT_OWNER, MERCHANT_STAFF |
| customer | `store` | `store_` | CUSTOMER (Phase 2) |

### Data Isolation

- Prisma middleware or service-layer filter enforces `tenantId` on merchant routes
- Platform routes use explicit `@BypassTenant()` decorator with audit log
- Shared types in `packages/shared` prevent DTO drift

## 7. Core Domain Model (Phase 1)

```
Tenant
├── MerchantProfile (onboardingStatus, businessName, kycFields)
├── User (merchant staff, role)
├── CrmCompany
├── CrmContact
├── CrmLead (stage: NEW | QUALIFIED | WON | LOST)
├── CrmActivity (type: CALL | NOTE | MEETING)
├── Distributor (commissionRate, commissionType: PERCENT | FIXED)
├── DistributorQrCode (token, expiresAt, bindType: MERCHANT | CUSTOMER)
└── Binding (bindableType, bindableId, distributorId, boundAt)

PlatformUser (super admin, no tenantId)
```

## 8. Key Flows

### 8.1 Merchant Onboarding

`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` | `REJECTED`

1. Merchant registers at `apps/merchant/register`
2. Submits business profile
3. Super admin reviews at `apps/admin/merchants`
4. On approval: Tenant provisioned, owner account activated, welcome email queued (BullMQ)

### 8.2 Distributor QR Binding

1. Merchant creates distributor with commission settings
2. API generates signed bind token → QR encodes `https://{merchant-domain}/bind/{token}`
3. Scanner opens bind page, authenticates if needed
4. `POST /api/v1/bindings/claim` verifies token, creates Binding, logs CrmActivity

### 8.3 CRM Lead from Binding

On successful bind: auto-create `CrmLead` with source `DISTRIBUTOR_QR`, link to distributor.

## 9. UI Design Direction

- **Reference:** [shadcn/ui](https://ui.shadcn.com/) dashboard blocks
- **Fonts:** Geist Sans + Geist Mono via `next/font`
- **Accent:** Professional blue (not purple)
- **Density:** Data-dense ERP (14px body, compact tables)
- **Icons:** Tabler Icons, stroke 1.5
- Full token spec: `docs/design/design-system.md`

## 10. Non-Goals (Phase 1)

- E-commerce catalog, cart, checkout
- Commission settlement payouts
- Inventory management, GL accounting
- WeChat/Alipay payment integration
- Mobile native apps

## 11. Success Metrics (Phase 1)

- Merchant can complete onboarding end-to-end in under 10 minutes
- Admin can approve/reject merchant in under 2 minutes
- QR bind flow completes in under 30 seconds
- All P0 acceptance criteria have automated tests
- Docker Compose brings full stack up with one command

## 12. Related Documents

| Document | Path |
|----------|------|
| Phase 1 PRD | `docs/prd/phase-1-foundation.md` |
| Phase 1 Architecture | `docs/architecture/phase-1-foundation.md` |
| Design System | `docs/design/design-system.md` |
| Admin wireframes | `docs/design/phase-1-admin.md` |
| Merchant wireframes | `docs/design/phase-1-merchant.md` |
| Implementation plan | `docs/superpowers/plans/2025-06-24-phase-1-foundation.md` |
| Execution guide | `docs/execution/README.md` |
