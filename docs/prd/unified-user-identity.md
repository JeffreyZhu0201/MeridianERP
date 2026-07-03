# Unified User Identity — Product Requirements

**Status:** In implementation  
**Updated:** 2026-07-03

## Problem

End users, merchant owners, and staff currently use separate identity models (`Customer`, `User`, `PlatformUser`, `Distributor`). Store registration is tenant-scoped; merchants self-register via the merchant portal. Platform admins cannot view all users in one place or proactively create merchants and assign an existing registered user as the merchant owner.

## Users

| Persona | Goals |
|---------|-------|
| End customer | Register once via the store portal; shop at any published branch |
| Platform admin | View all platform accounts with identity badges; create merchants and assign owners |
| Merchant owner (admin-assigned) | Log in to the merchant portal with the same credentials used at store registration |
| Prospective merchant (self-service) | Continue applying via `/merchant/register` and await approval |

## User Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-U1 | As an end customer, I want to register at the store portal without choosing a branch first so that I have one platform account | P0 | **Given** I open `/register`, **When** I submit email + password + optional name, **Then** a `PlatformAccount` is created and I receive a store JWT. **Given** the email exists, **When** I register again, **Then** I see a conflict error. |
| US-U2 | As an end customer, I want to log in globally at the store portal so that I can browse any branch after picking a store | P0 | **Given** valid credentials, **When** I log in at `/login`, **Then** I receive a store JWT with `sub` = platform account id. **Given** I enter a branch slug, **When** I shop, **Then** a `Customer` row is ensured for that tenant. |
| US-U3 | As a platform admin, I want to list all platform accounts with identity tags so that I understand who holds which roles | P0 | **Given** admin auth, **When** I open `/users`, **Then** I see paginated accounts with email, name, identities (`CONSUMER`, `MERCHANT_OWNER`, `MERCHANT_STAFF`, `DISTRIBUTOR`, `PLATFORM_ADMIN`), and linked merchant names. **Given** I search by email, **When** results load, **Then** matching accounts appear. |
| US-U4 | As a platform admin, I want to view a user detail so that I can inspect tenant associations before assigning ownership | P1 | **Given** a platform account id, **When** I open user detail, **Then** I see read-only consumer profiles, merchant roles, and order counts per tenant. |
| US-U5 | As a platform admin, I want to create a merchant and assign a registered user as owner so that they can operate the branch immediately | P0 | **Given** a registered `PlatformAccount` not already a `MERCHANT_OWNER`, **When** I submit the create-merchant form with business info + `ownerAccountId`, **Then** Tenant + `MerchantProfile` (`APPROVED`, `storePublished`) + `User` (`MERCHANT_OWNER`) are created. **Given** success, **When** the owner logs in at merchant `/login`, **Then** access is granted. |
| US-U6 | As a platform admin, I want duplicate owner assignment blocked so that one person cannot own multiple branches in P0 | P0 | **Given** an account already has `MERCHANT_OWNER`, **When** I assign them as owner on another merchant, **Then** the API returns a clear validation error. |
| US-U7 | As a prospective merchant, I want to self-register via the merchant portal so that I can still apply without admin creation | P0 | **Given** `/merchant/register`, **When** I complete the wizard, **Then** a `PlatformAccount` is created/linked, application is `SUBMITTED`, and approval flow is unchanged. |

## Non-Goals

- Multi-branch ownership per email (P0 blocks; future tenant picker)
- Distributor `accountId` FK (email match for identity badge only)
- Email verification, password reset, OAuth
- Platform admin CRUD for `PlatformUser` records

## Success Metrics

| Metric | Target |
|--------|--------|
| Admin create-merchant → owner login | < 30s manual test path |
| Store global register e2e | Green in CI |
| Existing merchant self-registration e2e | Regression green |

## Open Questions

| # | Question | Decision | Status |
|---|----------|----------|--------|
| 1 | Store JWT `sub` | `platformAccountId`; `ensureCustomer` at tenant scope | Locked |
| 2 | Keep slug-scoped store auth? | Yes, backward compatible | Locked |
| 3 | Merchant self-register | Keep alongside admin create | Locked |

## Related Documents

| Document | Path |
|----------|------|
| Architecture | `docs/architecture/unified-user-identity.md` |
| Design | `docs/design/unified-user-identity.md` |
| Product state | `docs/PRODUCT.md` |
