# MeridianERP — Platform Overview

**Version:** 1.2  
**Last updated:** 2025-06-25  
**Status:** Phases 1–4 core complete; storefront commerce + settings + distributor portal delivered

## Executive Summary

MeridianERP is a **multi-tenant SaaS platform** combining ERP, CRM, merchant onboarding, distributor management, e-commerce, and warehouse inventory. Four customer-facing portals share one NestJS API:

| Portal | App | Port | Audience |
|--------|-----|------|----------|
| Super Admin ERP | `apps/admin` | 3000 | Platform operators |
| Merchant Backend | `apps/merchant` | 3002 | Merchant staff |
| Consumer Store | `apps/store` | 3003 | End customers |
| Distributor Portal | `apps/distributor` | 3005 | Distributor agents (read-only) |

Shared contracts live in `packages/shared`; UI shells and primitives in `packages/ui` and `apps/ui-spec`.

JWT realms: `admin`, `merchant`, `store`, `distributor` — separate cookie namespaces per portal.

## Phase Roadmap & Status

| Phase | Focus | API | Admin UI | Merchant UI | Store UI |
|-------|-------|-----|----------|-------------|----------|
| **1** Foundation | Auth, onboarding, CRM, distributors, QR bind | ✅ Complete | ⚠️ Partial | ⚠️ Partial | N/A |
| **2** E-commerce | Catalog, cart, checkout, commission, settlements | ✅ Complete | ⚠️ Partial | ⚠️ Catalog only | ✅ Core |
| **3** Inventory | Warehouses, adjustments, POs, transfers, reports | ✅ Complete | ⚠️ Read-only | ✅ Complete | N/A |
| **4** Distributor | Bindings, commissions, distributor portal | ✅ Complete | ⚠️ Partial | ✅ Complete | N/A |
| **Settings** | Platform + tenant settings, team management | ✅ Complete | ✅ | ✅ | N/A |

**Legend:** ✅ Complete · ⚠️ Partial · ❌ Not started

## Domain Capabilities (as implemented)

### Authentication & Tenancy

- Four JWT realms: `admin`, `merchant`, `store`, `distributor`
- Multi-tenant isolation via `tenantId`; `TenantInterceptor` + guards
- Platform cross-tenant access on `/platform/*` routes

### Phase 2 — E-commerce (updated)

| Capability | API | Store UI | Tests |
|------------|-----|----------|-------|
| Public catalog browse | ✅ | ✅ | `store-catalog.e2e-spec.ts` |
| Customer register / login | ✅ | ✅ | `store-auth.e2e-spec.ts` |
| Cart CRUD (guest + customer) | ✅ | ✅ | via checkout e2e |
| Checkout + mock/live Stripe | ✅ | ✅ Payment Element | `store-checkout.e2e-spec.ts` |
| Customer order history | ✅ | ✅ `/account` | `store-orders.e2e-spec.ts` |
| Order confirmation page | ✅ | ✅ | Playwright `gaps-store.spec.ts` |

### Phase 3 — Inventory (updated)

| Capability | API | Merchant UI | Tests |
|------------|-----|-------------|-------|
| Stock transfers (US-3.15) | ✅ | ✅ `/inventory/transfers` | `inventory-transfers.e2e-spec.ts` |

### Platform Settings & Email

| Capability | API | UI | Tests |
|------------|-----|-----|-------|
| Merchant settings + team | ✅ | ✅ `/settings` | `merchant-settings.e2e-spec.ts` |
| Platform settings | ✅ | ✅ Admin `/settings` | `platform-settings.e2e-spec.ts` |
| BullMQ email queue | ✅ | N/A (console transport dev) | `email-queue.e2e-spec.ts` |
| Merchant dashboard + activity feed | ✅ | ✅ | `gaps-wave1.e2e-spec.ts` |

## Known Gaps & Bugs (cross-cutting)

| ID | Area | Issue | Status |
|----|------|-------|--------|
| G-1 | Admin reject | UI/API field alignment (`reason`) | ✅ Fixed |
| G-2 | Admin merchants | List filters not applied by API | ✅ Fixed |
| G-3 | Admin dashboard | Incomplete platform metrics | ⚠️ Open |
| G-4 | Admin merchant detail | Missing aggregated sections | ⚠️ Open |
| G-5 | Store checkout | Wrong API path | ✅ Fixed |
| G-6 | Store guest cart | Missing `X-Cart-Session` | ✅ Fixed |
| G-7 | Store customer bind | Customer QR attribution | ⚠️ Open |
| G-8 | Store account | No customer order history | ✅ Fixed |
| G-9 | Store payment | No Payment Element in UI | ✅ Fixed (mock + live) |
| G-10 | Merchant CRM | No activities UI | ⚠️ Open |
| G-11 | Merchant orders | No merchant orders UI | ⚠️ Open |
| G-12 | Settings | Stub settings pages | ✅ Fixed |

## Test Coverage Summary

| Suite | Location | Scope |
|-------|----------|-------|
| API e2e | `apps/api/test/*.e2e-spec.ts` (21 files) | Auth, onboarding, CRM, bindings, store, inventory, settings, email, distributor |
| Playwright | `e2e/phase-*.spec.ts`, `e2e/gaps-store.spec.ts` | Admin, store, merchant smoke |

**API e2e:** 97 tests passing (`jest --runInBand`).

## Technology Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Frontend:** Next.js 15 App Router, shadcn/ui, Tailwind CSS v4
- **Backend:** NestJS, Prisma (PostgreSQL), Redis cache, BullMQ queues
- **Payments:** Stripe (test mode; mock when key contains `mock`)
- **Containers:** Docker Compose — `postgres`, `redis`, `api`, `admin`, `merchant`, `store`

## Related Documents

| Document | Path |
|----------|------|
| Platform design spec | `docs/superpowers/specs/2025-06-24-meridianerp-platform-design.md` |
| Platform settings PRD | `docs/prd/platform-settings.md` |
| Distributor portal PRD | `docs/prd/distributor-portal.md` |
| Gaps epic handoffs | `docs/handoffs/gaps-wave-*.md` |
| Design system | `docs/design/design-system.md` |

## Recommended Next Work

1. **Merchant orders UI (G-11)** — wire `GET /merchant/orders` to merchant portal
2. **CRM activities UI (G-10)** — complete Phase 1 US-7
3. **Platform dashboard API (G-3)** — real metrics for admin home
4. **Admin merchant detail enrichment (G-4)**
5. **Store customer QR bind (G-7)** — end-to-end attribution in storefront UI
