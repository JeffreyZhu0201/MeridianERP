# Phase 1 Foundation — Architecture

> **See also:** [System Overview](./system-overview.md) — unified architecture diagrams, API module map, and full database ER / field reference.

## Overview

Monolith NestJS API (`apps/api`) serves two Next.js portals (`apps/admin`, `apps/merchant`) in Phase 1. PostgreSQL stores tenant-scoped data; Redis handles cache and BullMQ job queues. Shared contracts live in `packages/shared`.

## API Versioning

Base path: `/api/v1`

## Auth Architecture

### JWT Structure

```typescript
interface JwtPayload {
  sub: string;        // userId
  aud: 'admin' | 'merchant' | 'store';
  tenantId?: string;  // omitted for platform-only users
  roles: string[];
  iat: number;
  exp: number;
}
```

### Strategies

| Strategy | Guard | Routes |
|----------|-------|--------|
| `PlatformJwtStrategy` | `PlatformAuthGuard` | `/api/v1/platform/*` |
| `MerchantJwtStrategy` | `MerchantAuthGuard` | `/api/v1/merchant/*` |

### Tenant Scoping

```typescript
// TenantInterceptor injects tenantId from JWT into request context
// PrismaService extension filters queries: where: { tenantId: ctx.tenantId }
// @BypassTenant() for platform cross-tenant reads (audit logged)
```

## Prisma Schema (Phase 1)

```prisma
enum OnboardingStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
}

enum LeadStage {
  NEW
  QUALIFIED
  WON
  LOST
}

enum ActivityType {
  CALL
  NOTE
  MEETING
}

enum CommissionType {
  PERCENT
  FIXED
}

enum BindType {
  MERCHANT
  CUSTOMER
}

enum PlatformRole {
  SUPER_ADMIN
  PLATFORM_OPS
}

enum MerchantRole {
  MERCHANT_OWNER
  MERCHANT_STAFF
}

model PlatformUser {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      PlatformRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Tenant {
  id              String           @id @default(cuid())
  slug            String           @unique
  merchantProfile MerchantProfile?
  users           User[]
  companies       CrmCompany[]
  contacts        CrmContact[]
  leads           CrmLead[]
  activities      CrmActivity[]
  distributors    Distributor[]
  bindings        Binding[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model MerchantProfile {
  id               String           @id @default(cuid())
  tenantId         String           @unique
  tenant           Tenant           @relation(fields: [tenantId], references: [id])
  businessName     String
  legalName        String?
  contactEmail     String
  contactPhone     String?
  onboardingStatus OnboardingStatus @default(DRAFT)
  rejectionReason  String?
  submittedAt      DateTime?
  reviewedAt       DateTime?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}

model User {
  id        String       @id @default(cuid())
  tenantId  String
  tenant    Tenant       @relation(fields: [tenantId], references: [id])
  email     String
  password  String
  role      MerchantRole
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@unique([tenantId, email])
  @@index([tenantId])
}

model CrmCompany {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  name      String
  website   String?
  contacts  CrmContact[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
}

model CrmContact {
  id         String      @id @default(cuid())
  tenantId   String
  tenant     Tenant      @relation(fields: [tenantId], references: [id])
  companyId  String?
  company    CrmCompany? @relation(fields: [companyId], references: [id])
  firstName  String
  lastName   String
  email      String?
  phone      String?
  leads      CrmLead[]
  activities CrmActivity[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  @@index([tenantId])
}

model CrmLead {
  id            String     @id @default(cuid())
  tenantId      String
  tenant        Tenant     @relation(fields: [tenantId], references: [id])
  contactId     String?
  contact       CrmContact? @relation(fields: [contactId], references: [id])
  title         String
  stage         LeadStage  @default(NEW)
  source        String?
  distributorId String?
  distributor   Distributor? @relation(fields: [distributorId], references: [id])
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([tenantId])
  @@index([stage])
}

model CrmActivity {
  id        String       @id @default(cuid())
  tenantId  String
  tenant    Tenant       @relation(fields: [tenantId], references: [id])
  contactId String?
  contact   CrmContact?  @relation(fields: [contactId], references: [id])
  leadId    String?
  type      ActivityType
  note      String
  createdAt DateTime     @default(now())

  @@index([tenantId])
}

model Distributor {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id])
  name            String
  email           String?
  phone           String?
  commissionRate  Decimal           @db.Decimal(10, 4)
  commissionType  CommissionType    @default(PERCENT)
  isActive        Boolean           @default(true)
  qrCodes         DistributorQrCode[]
  bindings        Binding[]
  leads           CrmLead[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([tenantId])
}

model DistributorQrCode {
  id            String      @id @default(cuid())
  distributorId String
  distributor   Distributor @relation(fields: [distributorId], references: [id])
  token         String      @unique
  bindType      BindType    @default(MERCHANT)
  expiresAt     DateTime
  createdAt     DateTime    @default(now())

  @@index([distributorId])
}

model Binding {
  id            String      @id @default(cuid())
  tenantId      String
  tenant        Tenant      @relation(fields: [tenantId], references: [id])
  distributorId String
  distributor   Distributor @relation(fields: [distributorId], references: [id])
  bindableType  BindType
  bindableId    String
  boundAt       DateTime    @default(now())

  @@unique([bindableType, bindableId])
  @@index([tenantId])
  @@index([distributorId])
}
```

## API Contracts

### Platform Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/platform/auth/login` | Platform admin login |
| POST | `/api/v1/platform/auth/refresh` | Refresh token |
| POST | `/api/v1/platform/auth/logout` | Invalidate session |

### Merchant Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/merchant/auth/register` | Start onboarding (creates DRAFT) |
| POST | `/api/v1/merchant/auth/login` | Merchant login (APPROVED only) |
| POST | `/api/v1/merchant/auth/refresh` | Refresh token |

### Merchant Onboarding

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/merchant/onboarding` | Get own profile |
| PATCH | `/api/v1/merchant/onboarding` | Update profile |
| POST | `/api/v1/merchant/onboarding/submit` | Submit for review |

### Platform Merchants

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/platform/merchants` | List all tenants (paginated) |
| GET | `/api/v1/platform/merchants/:id` | Merchant detail |
| POST | `/api/v1/platform/merchants/:id/approve` | Approve application |
| POST | `/api/v1/platform/merchants/:id/reject` | Reject with reason |

### CRM (Merchant-scoped)

| Method | Path | Description |
|--------|------|-------------|
| CRUD | `/api/v1/merchant/companies` | Company management |
| CRUD | `/api/v1/merchant/contacts` | Contact management |
| CRUD | `/api/v1/merchant/leads` | Lead management |
| CRUD | `/api/v1/merchant/activities` | Activity log |
| PATCH | `/api/v1/merchant/leads/:id/stage` | Update pipeline stage |

### Distributors

| Method | Path | Description |
|--------|------|-------------|
| CRUD | `/api/v1/merchant/distributors` | Distributor management |
| POST | `/api/v1/merchant/distributors/:id/qr` | Generate QR token |
| GET | `/api/v1/merchant/distributors/:id/bindings` | List bindings |

### Bindings

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/bindings/claim` | Claim bind token (public, auth optional) |
| GET | `/api/v1/bindings/verify/:token` | Verify token validity (public) |

## Module Boundaries (NestJS)

```
apps/api/src/
  auth/           # JWT strategies, guards
  platform/       # Platform admin modules
    merchants/
  merchant/       # Merchant-scoped modules
    onboarding/
    crm/
    distributors/
  bindings/       # Public bind claim
  prisma/         # PrismaService + tenant extension
  queue/          # BullMQ processors (welcome email)
```

## Async Jobs (BullMQ)

| Queue | Job | Trigger |
|-------|-----|---------|
| `email` | `merchant.welcome` | Merchant approved |
| `email` | `merchant.rejected` | Merchant rejected |

## Caching (Redis)

| Key pattern | TTL | Invalidation |
|-------------|-----|--------------|
| `tenant:{id}:profile` | 5 min | On profile update |
| `distributor:{id}:qr:{hash}` | 1 hour | On new QR generation |

## ADRs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API style | REST | Team familiarity, OpenAPI tooling |
| Monolith vs microservices | Monolith | Phase 1 speed, shared transactions |
| QR token | HMAC-signed JWT | Stateless verify, expiry built-in |
| One binding per merchant | Unique constraint | Simplifies commission attribution |
| Commission settlement | Phase 2 | Settings only in Phase 1 |

## Error Shape

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [{ "field": "email", "message": "Invalid email" }]
}
```
