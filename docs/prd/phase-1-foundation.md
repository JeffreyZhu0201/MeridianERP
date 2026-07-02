# Phase 1 Foundation — Product Requirements

**Status:** API complete · Admin/Merchant UI ~85% · See [platform overview](../PRODUCT.md)

## Implementation Status (2025-06-25)

| ID | Story | API | Admin UI | Merchant UI | Tests |
|----|-------|-----|----------|-------------|-------|
| US-1 | Platform admin login | ✅ | ✅ | — | `platform-auth.e2e-spec.ts` |
| US-2 | Merchant registration | ✅ | — | ✅ | `merchant-onboarding.e2e-spec.ts` |
| US-3 | Approve/reject merchants | ✅ | ⚠️ Reject body mismatch (G-1) | — | `merchant-onboarding.e2e-spec.ts` |
| US-4 | Merchant login | ✅ | — | ✅ | onboarding e2e |
| US-5 | CRM contacts/companies | ✅ | — | ✅ | `crm.e2e-spec.ts` |
| US-6 | Lead pipeline stages | ✅ | — | ✅ | `crm.e2e-spec.ts` |
| US-7 | CRM activities | ✅ | — | ❌ No UI | `crm.e2e-spec.ts` |
| US-8 | Distributor commission settings | ✅ | — | ✅ | `bindings.e2e-spec.ts` |
| US-9 | Distributor QR generation | ✅ | — | ✅ | `bindings.e2e-spec.ts` |
| US-10 | QR bind claim flow | ✅ | — | ✅ `/bind/[token]` | `bindings.e2e-spec.ts` |
| US-11 | Cross-tenant merchant list | ✅ | ⚠️ Filters not wired to API | — | — |
| US-12 | Role-based access | ✅ | — | ⚠️ Owner-only on some inventory actions | — |

### Delivered beyond original PRD scope

- Platform orders read-only list (`apps/admin/app/orders`)
- Settlement ledger + CSV export (`apps/admin/app/settlements`)
- Platform read-only tenant inventory view (`apps/admin/app/inventory/tenants/[tenantId]`)

### Known gaps

- **G-1:** Admin reject sends `rejectionReason`; API expects `reason`
- **G-3:** Dashboard lacks dedicated API; two metrics hardcoded to 0
- **G-4:** Merchant detail page expects enriched payload not returned by API
- **G-10:** CRM activities — API only, no merchant timeline UI
- Admin tenant switcher documented but not implemented
- Merchant `/onboarding/pending` shows static status badge
- Global `/settings` stub on both portals

## Problem

Platform operators need a multi-tenant system to onboard merchants, manage distributor relationships, and run basic CRM — before launching the integrated e-commerce storefront in Phase 2.

## Users

| Persona | Goals |
|---------|-------|
| Platform Super Admin | Approve merchants, oversee platform health |
| Platform Ops | Review merchant applications, support tenants |
| Merchant Owner | Register business, manage CRM and distributors |
| Merchant Staff | Work leads and contacts daily |
| Distributor Agent | Share QR codes, track bound accounts |

## User Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-1 | As a platform admin, I want to log in to the super admin portal so that I can manage the platform | P0 | Given valid credentials, When I submit login, Then I receive a session and land on the dashboard. Given invalid credentials, Then I see an inline error. |
| US-2 | As a merchant owner, I want to register my business so that I can apply for platform access | P0 | Given I am on `/register`, When I complete the form and submit, Then my application status is SUBMITTED and I see a confirmation screen. |
| US-3 | As a platform admin, I want to review and approve merchant applications so that only vetted merchants join | P0 | Given a SUBMITTED application, When I approve it, Then Tenant is provisioned and merchant owner can log in. When I reject, Then merchant sees rejection reason. |
| US-4 | As a merchant owner, I want to log in to the merchant portal so that I can manage my business | P0 | Given APPROVED status, When I log in with correct credentials, Then I access my tenant-scoped dashboard. |
| US-5 | As a merchant staff, I want to manage CRM contacts and companies so that I track customer relationships | P0 | Given I am authenticated, When I CRUD contacts/companies, Then data is scoped to my tenantId only. |
| US-6 | As a merchant staff, I want to manage leads with pipeline stages so that I track sales progress | P0 | Given a lead exists, When I change stage NEW→QUALIFIED→WON, Then stage history is recorded. |
| US-7 | As a merchant staff, I want to log CRM activities so that I have an audit trail | P1 | Given a contact or lead, When I add a note/call/meeting, Then activity appears in timeline. |
| US-8 | As a merchant owner, I want to create distributors with commission settings so that I configure profit sharing | P0 | Given distributor form, When I set name + commissionRate + commissionType, Then distributor is saved tenant-scoped. |
| US-9 | As a distributor, I want a QR code so that merchants/customers can bind to me | P0 | Given an active distributor, When I request QR, Then I receive a scannable code encoding a signed bind URL. |
| US-10 | As a merchant user, I want to scan a distributor QR so that I bind to that distributor | P0 | Given valid unexpired token, When I claim bind, Then Binding is created and CrmLead auto-generated with source DISTRIBUTOR_QR. |
| US-11 | As a platform admin, I want to view merchants across tenants so that I can provide support | P1 | Given super admin role, When I open merchants list, Then I see all tenants with status filters. |
| US-12 | As a merchant owner, I want role-based access so that staff have appropriate permissions | P1 | Given MERCHANT_STAFF role, When accessing distributor settings, Then write is denied. |

## Non-Goals

- E-commerce product catalog, cart, checkout
- Commission settlement and payouts
- Inventory, warehousing, purchase orders
- Customer (store) portal login
- Email/SMS delivery (welcome email queued but sending stubbed OK for Phase 1)
- KYC document upload (text fields only in Phase 1)

## Success Metrics

| Metric | Target |
|--------|--------|
| Merchant onboarding completion rate | > 80% of started applications submitted |
| Admin review time | < 2 min median per application |
| QR bind success rate | > 95% of valid token claims succeed |
| API p95 latency (CRUD) | < 300ms on local Docker stack |
| P0 test coverage | 100% acceptance criteria mapped to tests |

## Open Questions

| # | Question | Decision | Status |
|---|----------|----------|--------|
| 1 | QR token expiry duration? | 7 days default, configurable per distributor | ✅ Implemented |
| 2 | Can one entity bind to multiple distributors? | No — one active binding per merchant (`@@unique` on bindable) | ✅ Implemented |
| 3 | Platform admin write access to tenant CRM? | Read-only default; write requires audit log entry | ✅ Read-only in practice |

## Related Documents

| Document | Path |
|----------|------|
| Platform overview | `docs/PRODUCT.md` |
| Architecture | `docs/architecture/phase-1-foundation.md` |
| Admin wireframes | `docs/design/phase-1-admin.md` |
| Merchant wireframes | `docs/design/phase-1-merchant.md` |
