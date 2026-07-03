# Unified User Identity — Architecture

**Updated:** 2026-07-03

## Overview

Introduce `PlatformAccount` as the canonical credential store (email + password). `Customer` and `User` link via `accountId`. Store portal adds platform-level auth endpoints; admin portal gains user directory and merchant creation with owner assignment.

## Data Model

```prisma
model PlatformAccount {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  customers     Customer[]
  merchantUsers User[]
}
```

**Changes to existing models:**
- `Customer.accountId` → `PlatformAccount` (required after migration)
- `User.accountId` → `PlatformAccount` (required after migration)
- `Customer.password` and `User.password` removed after backfill (password lives on `PlatformAccount`)

**Identity computation (API layer, not stored):**

| Identity | Rule |
|----------|------|
| `CONSUMER` | `customers.length > 0` |
| `MERCHANT_OWNER` | any `merchantUsers` with `role = MERCHANT_OWNER` |
| `MERCHANT_STAFF` | any `merchantUsers` with `role = MERCHANT_STAFF` |
| `DISTRIBUTOR` | `Distributor.email` matches account email |
| `PLATFORM_ADMIN` | `PlatformUser.email` matches account email |

## ADR: Store JWT `sub`

- **Decision:** `sub` = `platformAccountId` for new global store tokens.
- **Rationale:** One account across branches; `ensureCustomer(accountId, tenantId)` creates tenant-scoped `Customer` on first slug-scoped action.
- **Slug-scoped legacy:** Existing slug routes upsert account + customer; token may still use account id after refactor.

## API Contracts

### Store auth (platform-level)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/v1/store/auth/register` | `{ email, password, firstName?, lastName? }` | `{ accessToken, account: { id, email, firstName, lastName } }` |
| POST | `/api/v1/store/auth/login` | `{ email, password }` | `{ accessToken, account }` |

Slug-scoped routes unchanged in path; implementation upserts `PlatformAccount` and links `Customer`.

### Platform users

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/api/v1/platform/users` | `search?, identity?, page?, limit?` | `{ data: PlatformAccountListItem[], meta }` |
| GET | `/api/v1/platform/users/:id` | — | `PlatformAccountDetail` |

### Platform merchants (create)

| Method | Path | Body |
|--------|------|------|
| POST | `/api/v1/platform/merchants` | `CreatePlatformMerchantDto` |

```typescript
interface CreatePlatformMerchantDto {
  businessName: string;
  legalName?: string;
  contactEmail: string;
  contactPhone?: string;
  slug?: string;
  ownerAccountId: string;
  recruitedByDistributorId?: string;
  autoApprove?: boolean; // default true
}
```

**Transaction:**
1. Validate `ownerAccountId`; reject if already `MERCHANT_OWNER`
2. Create `Tenant` (unique slug)
3. Create `MerchantProfile` (`APPROVED` when `autoApprove !== false`, `storePublished: true`)
4. Create `User` (`MERCHANT_OWNER`, `accountId`)
5. `ensureCustomer` for owner on new tenant (optional convenience)

## Module Boundaries

| Module | Path |
|--------|------|
| Platform accounts service | `apps/api/src/platform/accounts/` (shared helper) |
| Platform users | `apps/api/src/platform/users/` |
| Store platform auth | `apps/api/src/store/auth/` |
| Merchant auth | `apps/api/src/merchant/auth/` (login via account password) |

## Migration Strategy

1. Add `PlatformAccount` + nullable `accountId` on `Customer` / `User`
2. Backfill: dedupe by email from `User` then `Customer`; copy password hash
3. Set `accountId` NOT NULL; drop `password` columns on `Customer` / `User`

## Tenant Isolation

- `PlatformAccount` is cross-tenant; platform admin reads are explicit and auditable.
- Merchant and store APIs continue scoping business data by `tenantId`.
- Generic not-found on cross-tenant leaks.

## Shared Types

Add to `packages/shared/src/platform.ts`:
- `UserIdentity` enum
- `PlatformAccountListItem`
- `PlatformAccountDetail`
- `CreatePlatformMerchantRequest`

## Tests

- `apps/api/test/store-auth.e2e-spec.ts` — global register/login
- `apps/api/test/platform-users.e2e-spec.ts` — list, search, identities
- `apps/api/test/merchant-onboarding.e2e-spec.ts` — admin create + owner login; self-register regression
