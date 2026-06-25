# Phase 4 — Distributor Enhancements Architecture

**Version:** 1.1  
**Last updated:** 2025-06-25  
**Status:** Slices 1–2 shipped; Slice 3 ready for implementation (`docs/architecture/phase-4-distributor-slice3.md`)  
**PRD:** `docs/prd/phase-4-distributor-enhancements.md`  
**Depends on:** Phase 1 (bindings, distributors), Phase 2 (checkout attribution, `CommissionLedger`)

## Overview

Phase 4 closes the gap between Phase 1–2 backend capabilities and operable distributor channel sales. The work splits into five implementation slices; **Slice 1 (US-4.1 / G-7)** unblocks the storefront customer bind path and is the mandatory first deliverable.

Core decisions:

| Topic | Decision |
|-------|----------|
| Store customer claim | **New store-scoped endpoint** with `StoreAuthGuard`; keep merchant claim unchanged |
| CUSTOMER QR URL | `{STORE_APP_URL}/s/{tenantSlug}/bind/{token}` |
| Cart attribution | Set `cart.distributorId` on claim; lazy hydrate from `Binding` on cart resolve |
| QR regenerate | Revoke **same bindType only**; add `revokedAt` on `DistributorQrCode` |
| Commission reads | Tenant-scoped list + summary APIs over existing `CommissionLedger` |
| Analytics | Compute-on-read with indexes; optional Redis summary cache (5 min TTL) |
| Merchant “paid out” | **Platform `SETTLED` only** — no merchant-local payout flag in Phase 4 |
| QR expiry bounds | Default 7 days; merchant-configurable **1–90 days** per generation |
| In-app notifications (P1) | Dashboard recent-activity widget only; no persistent inbox |

Shared contracts live in `packages/shared/src/distributors.ts`.

---

## Slice 1 — Store Customer Bind (US-4.1, G-7) — P0 First

### Problem (current)

1. `POST /bindings/claim` requires `MerchantAuthGuard` — store JWT rejected.
2. `BindingsService.claim` sets `bindableId = tenantId` for all bind types — wrong for CUSTOMER (must be `customerId`).
3. `generateQr` always returns `{MERCHANT_APP_URL}/bind/{token}` even for `bindType: CUSTOMER`.
4. No cart `distributorId` wiring after bind — checkout reads `cart.distributorId` only.

### Auth contract (ADR)

**Do not** add dual guards to `POST /bindings/claim`. Split by audience:

| Endpoint | Guard | bindType | bindableId | Side effects |
|----------|-------|----------|------------|--------------|
| `POST /api/v1/bindings/claim` | `MerchantAuthGuard` | `MERCHANT` | `tenantId` | Create binding; CRM lead (`DISTRIBUTOR_QR`) |
| `POST /api/v1/store/:slug/bindings/claim` | `StoreAuthGuard` | `CUSTOMER` | `customerId` (`sub`) | Create binding; set `cart.distributorId`; **no** CRM lead |

Rationale: JWT `aud` enforcement is explicit; bindable identity and side effects differ; NestJS guard composition stays simple.

### Verify (unchanged path, enriched payload)

`GET /api/v1/bindings/verify/:token` — `@Public()`, no auth.

**Success** (`200`, body — not HTTP 404 for invalid tokens):

```typescript
// packages/shared — BindVerifySuccess
{
  valid: true,
  distributorId: string,
  distributorName: string,
  bindType: 'MERCHANT' | 'CUSTOMER',
  expiresAt: string,       // ISO 8601
  requiresAuth: boolean,   // true when bindType === CUSTOMER
  tenantSlug?: string      // included for CUSTOMER — store UI slug validation
}
```

**Failure** (`200`):

```typescript
{ valid: false, error: string }
```

Verify checks (in order):

1. Row exists in `DistributorQrCode` for `token`
2. `revokedAt` is null (Slice 2; until migration, treat as always valid)
3. `expiresAt >= now()`
4. JWT signature valid (`BIND_TOKEN_SECRET`)
5. Load `tenant.slug` for CUSTOMER responses

Store bind page (`/s/[slug]/bind/[token]`) should compare URL `slug` with `tenantSlug` when present; mismatch → error state.

### Store claim flow

```
Customer opens /s/{slug}/bind/{token}
  → GET /bindings/verify/{token}
  → if requiresAuth && no store JWT → login redirect with ?from=
  → POST /store/{slug}/bindings/claim { token } + Bearer store JWT
  → Binding(CUSTOMER, customerId) + cart.distributorId = distributorId
  → success UI
```

**`POST /api/v1/store/:slug/bindings/claim`**

- Guard: `StoreAuthGuard`
- Body: `StoreClaimBindingRequest` — `{ token: string }`
- Validates:
  - Resolved tenant from `:slug` matches JWT `tenantId`
  - Token `bindType === CUSTOMER`
  - Token tenant matches resolved tenant
  - No existing `Binding` for `(CUSTOMER, customerId)` with a **different** `distributorId` → `409 Conflict` with message: `"You are already bound to another distributor"`
  - Same distributor re-claim → idempotent `200` with existing binding + cart state
- Response: `StoreClaimBindingResponse` (see shared types)

**Merchant claim** (refactor only): reject tokens where `bindType !== MERCHANT` with `400 Bad Request`.

### Cart `distributorId` attribution

Attribution order at checkout (and cart reads):

1. **Explicit cart field** — `cart.distributorId` set on successful CUSTOMER claim (primary).
2. **Lazy hydrate** — in `StoreCartService.resolveCart`, when logged-in customer and `cart.distributorId` is null, lookup:

   ```sql
   Binding WHERE bindableType = CUSTOMER AND bindableId = customerId AND tenantId = tenantId
   ```

   If found, `UPDATE cart SET distributorId = binding.distributorId` (same request).

3. **Checkout fallback** — in `StoreCheckoutService.checkout`, repeat binding lookup if cart still null before `order.create` (defensive).

Guest carts: no binding attribution until customer logs in and claims.

### CUSTOMER QR URL generation

Update `DistributorsService.generateQr`:

```typescript
const base =
  bindType === BindType.CUSTOMER
    ? `${storeAppUrl}/s/${tenant.slug}/bind/${token}`
    : `${merchantAppUrl}/bind/${token}`;
```

Requires loading `tenant.slug` when generating QR. Env vars: `STORE_APP_URL` (default `http://localhost:3003`), `MERCHANT_APP_URL`.

### Module boundaries (Slice 1)

```
apps/api/src/
  bindings/
    bindings.service.ts      # verify(), claimMerchant(), shared token validation
    bindings.controller.ts     # verify + merchant claim
  store/
    bindings/
      store-bindings.controller.ts
      store-bindings.service.ts  # thin wrapper → BindingsService.claimCustomer()
```

```
apps/store/app/s/[slug]/bind/[token]/page.tsx   # POST store claim path
apps/merchant/app/bind/[token]/page.tsx         # unchanged merchant path
packages/shared/src/distributors.ts             # contracts
```

### Tests (Slice 1)

Extend `apps/api/test/bindings.e2e-spec.ts`:

- Generate CUSTOMER QR → URL contains `/s/{slug}/bind/`
- Store customer register/login → claim → binding row with `bindableId = customerId`
- Second claim different distributor → `409`
- Cart GET after claim → `distributorId` set
- Checkout → order `distributorId` → PAID → `CommissionLedger` row

Add Playwright smoke: store bind → checkout → commission (after Slice 1 API green).

---

## Slice 2 — QR Management (US-4.4, US-4.8) — P0

**Stories:** US-4.4 (manage QR links), US-4.8 (separate merchant vs customer workflows)  
**Depends on:** Slice 1 shipped — CUSTOMER URLs and store bind path must be live before merchants run customer QR campaigns.

### Goals

| US-4.4 criterion | Slice 2 deliverable |
|------------------|---------------------|
| Generate MERCHANT or CUSTOMER QR with correct portal URL | Extend existing `POST …/qr` (Slice 1 URL logic retained) |
| Regenerate invalidates previous token, shows expiry | Transactional `revokedAt`; response includes `expiresAt` |
| Download PNG suitable for print/social | `GET …/qr/:qrId/download` — server-rendered PNG |
| Configurable expiry (default 7d, bounded) | `expiresInDays` 1–90 on POST body |
| QR history with active/expired/revoked | `GET …/qr` paginated list with computed `status` |

### Prisma migration plan — `DistributorQrCode.revokedAt`

**Migration name:** `20250625120000_distributor_qr_revoked_at`  
**Command:** `rtk pnpm --filter @meridian/api prisma:migrate -- --name distributor_qr_revoked_at`

**Schema diff** (`apps/api/prisma/schema.prisma`):

```prisma
model DistributorQrCode {
  id            String      @id @default(cuid())
  distributorId String
  distributor   Distributor @relation(fields: [distributorId], references: [id])
  token         String      @unique
  bindType      BindType    @default(MERCHANT)
  expiresAt     DateTime
  revokedAt     DateTime?   // NEW — set on regenerate (same bindType)
  createdAt     DateTime    @default(now())

  @@index([distributorId])
  @@index([distributorId, bindType])  // NEW — revoke + history queries
}
```

**SQL (generated):**

```sql
ALTER TABLE "DistributorQrCode" ADD COLUMN "revokedAt" TIMESTAMP(3);

CREATE INDEX "DistributorQrCode_distributorId_bindType_idx"
  ON "DistributorQrCode"("distributorId", "bindType");
```

| Risk | Mitigation |
|------|------------|
| Existing rows have `revokedAt = NULL` | Treat as not revoked; no backfill |
| Multiple “active” rows per bindType pre-migration | First regenerate after deploy revokes all non-expired same-type rows in one `updateMany` |
| JWT `exp` vs DB `expiresAt` drift | Set both from same `expiresInDays` at generation time |
| Breaking API | Additive column only; no request shape breaks |

**Rollback:** drop index + column (only if no production revoke data to preserve).

### Token status (computed)

`QrTokenStatus`: `ACTIVE` | `EXPIRED` | `REVOKED` — not stored.

| Status | Condition |
|--------|-----------|
| `REVOKED` | `revokedAt != null` |
| `EXPIRED` | `revokedAt == null && expiresAt < now()` |
| `ACTIVE` | otherwise |

```typescript
// packages/shared — computeQrStatus(revokedAt, expiresAt)
function computeQrStatus(revokedAt: Date | null, expiresAt: Date): QrTokenStatus {
  if (revokedAt) return 'REVOKED';
  if (expiresAt < new Date()) return 'EXPIRED';
  return 'ACTIVE';
}
```

### Regenerate / invalidation (ADR)

On `POST /merchant/distributors/:id/qr`:

1. **`assertOwner(user)`** — `MERCHANT_STAFF` → `403 Forbidden`.
2. Validate `expiresInDays` ∈ [1, 90] (default **7**); clamp in DTO.
3. In a **single transaction**:
   - `updateMany` set `revokedAt = now()` where `distributorId`, `bindType` match, `revokedAt IS NULL`, `expiresAt > now()`.
   - Sign JWT with `expiresIn: '${expiresInDays}d'` and `purpose: 'bind'`.
   - `create` new `DistributorQrCode` row (`expiresAt = now() + expiresInDays`).
4. **Do not** revoke the other `bindType` — MERCHANT and CUSTOMER campaigns run concurrently (PRD open question #1 resolved).

**Verify / claim enforcement** (update Slice 1 paths):

| Check | Location | Error |
|-------|----------|-------|
| `revokedAt != null` | `BindingsService.verify`, `validateBindToken` | `{ valid: false, error: 'This link has been replaced. Request a new code from your distributor.' }` or `400` on claim |
| `expiresAt < now()` | same | existing expired message |
| JWT signature | same | existing invalid message |

Check order: row exists → **revoked** → expired → JWT verify.

### API contracts

Base path: `/api/v1/merchant/distributors/:id/qr`  
Auth: `MerchantAuthGuard` (tenant from JWT).

#### `POST /merchant/distributors/:id/qr` — generate / regenerate

**RBAC:** `MERCHANT_OWNER` only.

**Request** (`GenerateQrRequest`):

```typescript
{
  bindType?: 'MERCHANT' | 'CUSTOMER';  // default MERCHANT
  expiresInDays?: number;              // 1–90, default 7
}
```

**Response** (`GenerateQrResponse` — existing, unchanged):

```typescript
{
  id: string;           // NEW — qr row id (for download + history)
  token: string;
  url: string;
  bindType: BindType;
  expiresAt: string;    // ISO 8601
}
```

**URL construction** (shared helper `buildBindQrUrl`):

```typescript
bindType === CUSTOMER
  ? `${STORE_APP_URL}/s/${tenant.slug}/bind/${token}`
  : `${MERCHANT_APP_URL}/bind/${token}`;
```

**HTTP:** `201 Created` on first generate; `201` on regenerate (new row).

#### `GET /merchant/distributors/:id/qr` — history

**RBAC:** `MERCHANT_OWNER` + `MERCHANT_STAFF` (read-only).

**Query** (`QrHistoryListQuery`):

| Param | Default | Notes |
|-------|---------|-------|
| `page` | 1 | |
| `limit` | 20 | max 100 |
| `bindType` | — | optional filter |

**Response** (`QrHistoryListResponse`):

```typescript
{
  items: QrHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}
```

**`QrHistoryEntry`:**

```typescript
{
  id: string;
  bindType: BindType;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  url: string;   // rebuilt via buildBindQrUrl — survives env URL changes
}
```

Order: `createdAt DESC`.

#### `GET /merchant/distributors/:id/qr/:qrId/download` — asset download

**RBAC:** `MERCHANT_OWNER` + `MERCHANT_STAFF`.

**Query:** `format=png` (default; `svg` optional P1 — PNG required for US-4.4).

**Response:**

- `200` — `Content-Type: image/png`
- `Content-Disposition: attachment; filename="distributor-{slugOrId}-{bindType}-qr.png"`
- Body: PNG bytes (server-rendered via `qrcode` npm package)

**Validation:**

1. Distributor belongs to JWT `tenantId`.
2. `qrId` belongs to `:id` distributor.
3. No requirement that token be ACTIVE — merchants may download expired codes for audit (optional: warn in UI).

**Errors:** `404` distributor/qr not found; `403` wrong tenant.

### NestJS module changes

```
apps/api/src/merchant/distributors/
  distributors.controller.ts   # + GET :id/qr, GET :id/qr/:qrId/download
  distributors.service.ts      # generateQr transaction, listQrHistory, downloadQrPng
  dto/distributor.dto.ts       # expiresInDays on GenerateQrDto; QrHistoryListQueryDto
  qr-url.helper.ts             # buildBindQrUrl(bindType, tenantSlug, token)
```

**Dependencies:** add `qrcode` + `@types/qrcode` to `@meridian/api`.

**Controller route order:** register `GET :id/qr` and `GET :id/qr/:qrId/download` **before** `GET :id` if path ambiguity arises (Nest matches in declaration order; current `GET :id` is fine if qr routes are more specific — place `GET :id/qr` routes above `GET :id`).

**BindingsService** (cross-cutting):

- `verify()` — check `qr.revokedAt` before expiry.
- `validateBindToken()` — throw `400` if revoked.

**Mock Prisma** (`test/helpers/mock-prisma.ts`): add `revokedAt` to `DistributorQrCodeRecord`; implement `updateMany` on qrCodes store for revoke tests.

### Caching (optional)

| Key | TTL | Invalidate |
|-----|-----|------------|
| `distributor:{id}:qr:active:{bindType}` | 1 h | on `POST …/qr` |

Skip for MVP unless history endpoint is hot; history is DB-read with index.

### Shared contracts (`packages/shared/src/distributors.ts`)

Add / extend:

```typescript
export interface GenerateQrRequest {
  bindType?: BindType;
  expiresInDays?: number;
}

export interface GenerateQrResponse {
  id: string;
  token: string;
  url: string;
  bindType: BindType;
  expiresAt: string;
}

export interface QrHistoryListQuery {
  page?: number;
  limit?: number;
  bindType?: BindType;
}

export interface QrHistoryListResponse {
  items: QrHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}
```

(`QrHistoryEntry`, `QrTokenStatus` already defined.)

### Next.js — merchant distributor detail

```
apps/merchant/app/distributors/[id]/
  _components/qr-display.tsx       # expiry select, download, regenerate
  _components/qr-history-table.tsx # NEW — status badges, dates
  page.tsx                         # prefetch GET …/qr on load (optional)
```

**UI (US-4.8):**

- Bind-type picker with labels: **Merchant partner** vs **Store customer** (existing).
- Expiry select: 7 / 14 / 30 / 90 days (or number input 1–90).
- **Download PNG** — `fetch` download endpoint with auth cookie/header → blob → `<a download>`.
- **History table** — `Table` + `Badge` (`ACTIVE` → default, `EXPIRED` → secondary, `REVOKED` → destructive).
- Staff users: hide/disable Generate; show history + download only.

Keep `react-qr-code` for on-screen preview; print/share uses server PNG.

### Tests (Slice 2)

Extend `apps/api/test/bindings.e2e-spec.ts` (or new `distributor-qr.e2e-spec.ts`):

| Case | Assertion |
|------|-----------|
| Generate MERCHANT QR | `201`, URL contains `/bind/`, `expiresAt` ≈ now + 7d |
| Regenerate MERCHANT | prior token `verify` → `valid: false`; new token `valid: true` |
| CUSTOMER QR survives MERCHANT regenerate | parallel bindTypes independent |
| `expiresInDays: 30` | JWT + DB `expiresAt` aligned |
| `expiresInDays: 0` or `91` | `400` validation |
| Staff POST qr | `403` |
| Staff GET history | `200` |
| GET download | `200`, `content-type` image/png, body length > 0 |
| History pagination | `total` matches seed count |

### Slice 2 ADRs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Revoke scope | Same `bindType` only | Concurrent MERCHANT + CUSTOMER campaigns |
| Expiry bounds | 1–90 days, default 7 | PRD + open question #2 |
| Download render | Server PNG via `qrcode` | Print fidelity; consistent branding size (512×512 default) |
| History URL | Rebuild from token + env | Env URL changes don’t stale history |
| Download inactive tokens | Allowed | Audit / re-print expired campaign materials |
| RBAC pattern | `assertOwner()` in service | Matches `MerchantInventoryService` — no new guard infra |

---

## Slice 3 — Merchant Visibility (US-4.2, US-4.3) — P0

### Commission ledger read APIs

Tenant-scoped queries on existing `CommissionLedger` + joins to `Order`, `Distributor`, optional `SettlementBatch`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/merchant/commissions` | Paginated statement rows |
| `GET` | `/merchant/commissions/summary` | Aggregates for date range |
| `GET` | `/merchant/distributors/:id/performance` | Per-distributor dashboard metrics |
| `GET` | `/merchant/distributors/:id/bindings` | Existing or new — list bindings with optional order stats |

**Query params** (`CommissionListQuery`):

- `page`, `limit` (default 20)
- `distributorId`, `status` (`ACCRUED` | `SETTLED`)
- `from`, `to` (ISO date; default last 30 days)

**`GET /merchant/commissions` response:**

```typescript
PaginatedResponse<CommissionStatementRow>
```

Row fields: order reference, distributor name, order amount, commission type/rate from `Distributor` at accrual time (denormalize `commissionType`/`commissionRate` onto ledger in a follow-up migration if needed; MVP: join live distributor settings with documented staleness risk).

**`GET /merchant/commissions/summary`:**

```typescript
CommissionSummary // accruedTotal, settledTotal, entryCount, from, to
```

**`GET /merchant/distributors/:id/performance`:**

```typescript
DistributorPerformanceSummary
```

Metrics (date-filtered):

| Metric | Source |
|--------|--------|
| `bindingsMerchant` / `bindingsCustomer` | `Binding` counts by `bindableType` |
| `attributedOrderCount` | `Order` where `distributorId` and `status = PAID` |
| `attributedOrderRevenue` | `SUM(order.total)` |
| `commissionAccrued` / `commissionSettled` | `SUM(CommissionLedger.amount)` by status |

RBAC: `MERCHANT_OWNER` and `MERCHANT_STAFF` — read-only.

### Aggregation strategy (ADR)

**Compute on read** with Prisma aggregates for Phase 4 MVP. Indexes already present on `tenantId`, `distributorId`; add composite index if slow:

```prisma
@@index([tenantId, createdAt])  // CommissionLedger
@@index([tenantId, distributorId, status])
```

Optional Redis cache:

| Key | TTL | Invalidate |
|-----|-----|------------|
| `tenant:{id}:distributor:{id}:perf:{from}:{to}` | 5 min | binding create, order PAID |
| `tenant:{id}:commission:summary:{from}:{to}` | 5 min | commission accrue, settlement |

---

## Slice 4 — Platform Admin (US-4.5) — P0

### Dashboard API

**`GET /api/v1/platform/dashboard`** — `PlatformAuthGuard`

```typescript
PlatformDashboardStats
```

| Field | Computation |
|-------|-------------|
| `totalMerchants` | `MerchantProfile` count |
| `pendingReview` | status `SUBMITTED` \| `UNDER_REVIEW` |
| `activeDistributors` | `Distributor` where `isActive = true` (cross-tenant) |
| `bindingsLast30Days` | `Binding` where `boundAt >= now() - 30d` |
| `commissionAccruedLast30Days` | `SUM(CommissionLedger.amount)` where `status = ACCRUED` and `createdAt >= now() - 30d` |
| `recentMerchants` | Latest 5 profiles |

Remove admin UI fallback that hardcodes distributor metrics to zero when this endpoint exists.

### Merchant detail enrichment (G-4)

Extend `GET /api/v1/platform/merchants/:id` response:

```typescript
distributors: MerchantDistributorSummary[]
crmSummary: { contacts, companies, leads }
```

Per distributor: `bindingCount`, `bindingsLast30Days`, `attributedOrdersLast30Days`.

---

## Slice 5 — Notifications & Order Attribution UI (US-4.6, US-4.7) — P1

### BullMQ jobs

| Queue | Job | Payload | Trigger |
|-------|-----|---------|---------|
| `email` | `distributor.binding.created` | `{ tenantId, distributorId, bindType, boundAt }` | After binding create |
| `email` | `commission.accrued` | `{ tenantId, orderId, distributorId, amount }` | After `CommissionService.accrueOnPaid` |

Recipient: merchant owner email (tenant primary owner). Configurable recipient list deferred per PRD open question.

In-app: merchant dashboard **recent activity widget** (last 7 days) fed by same events — no `Notification` table in P1.

### Order / binding enrichment (US-4.7)

- Merchant order detail: include `distributor` + `commissionEntry` (extend existing order DTO).
- Distributor bindings list: add `orderCount`, `lastOrderAt` per CUSTOMER binding via subquery on `Order`.

---

## Data Model Summary

### Existing (no change for Slice 1)

- `Binding` — `@@unique([bindableType, bindableId])` enforces one CUSTOMER binding per customer globally per bind type (not per distributor). Conflict on second distributor is application-level `409`.
- `Cart.distributorId` — already on model.
- `CommissionLedger` — unchanged.

### Slice 2 migration

- `DistributorQrCode.revokedAt DateTime?`
- `@@index([distributorId, bindType])`

### Future (out of Phase 4)

- `Distributor.parentId` for US-4.9 hierarchy
- Denormalized commission rate on ledger for historical accuracy

---

## API Contracts (complete reference)

### Public / bindings

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| `GET` | `/bindings/verify/:token` | Public | — | `BindVerifyResponse` |
| `POST` | `/bindings/claim` | Merchant JWT | `MerchantClaimBindingRequest` | `BindingRecord` |
| `POST` | `/store/:slug/bindings/claim` | Store JWT | `StoreClaimBindingRequest` | `StoreClaimBindingResponse` |

### Merchant — distributors & QR

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| CRUD | `/merchant/distributors` | Merchant | Existing |
| `POST` | `/merchant/distributors/:id/qr` | Owner | `{ bindType?, expiresInDays? }` → `GenerateQrResponse` (includes `id`) |
| `GET` | `/merchant/distributors/:id/qr` | Merchant | `QrHistoryEntry[]` |
| `GET` | `/merchant/distributors/:id/qr/:qrId/download` | Merchant | PNG bytes |
| `GET` | `/merchant/distributors/:id/performance` | Merchant | `DistributorPerformanceSummary` |
| `GET` | `/merchant/distributors/:id/bindings` | Merchant | Bindings + optional stats |

### Merchant — commissions

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/merchant/commissions` | Merchant | `PaginatedResponse<CommissionStatementRow>` |
| `GET` | `/merchant/commissions/summary` | Merchant | `CommissionSummary` |

### Platform

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/platform/dashboard` | Admin | `PlatformDashboardStats` |
| `GET` | `/platform/merchants/:id` | Admin | Extended with `distributors`, `crmSummary` |

All types: `packages/shared/src/distributors.ts`.

---

## Module Boundaries (NestJS)

```
apps/api/src/
  bindings/              # verify, claimMerchant
  store/
    bindings/            # claimCustomer (Slice 1)
  merchant/
    distributors/        # QR, performance
    commissions/         # NEW module (Slice 3)
  platform/
    dashboard/           # NEW (Slice 4)
    merchants/           # enrich detail
  commission/            # accrue (existing); no merchant reads here
```

## Module Boundaries (Next.js)

| App | Routes / features |
|-----|-------------------|
| `apps/store` | `/s/[slug]/bind/[token]` — store claim API |
| `apps/merchant` | `/distributors`, `/distributors/[id]` — performance, QR, statements |
| `apps/admin` | Dashboard metrics; merchant detail distributors |

---

## Async Jobs

| Queue | Job | Slice |
|-------|-----|-------|
| `email` | `distributor.binding.created` | 5 |
| `email` | `commission.accrued` | 5 |
| `commission` | `order.accrue` | existing |

Retry: 3 attempts, exponential backoff (existing queue config).

---

## Caching

| Key | TTL | Slice |
|-----|-----|-------|
| `tenant:{id}:distributor:{id}:perf:{from}:{to}` | 5 min | 3 |
| `tenant:{id}:commission:summary:{from}:{to}` | 5 min | 3 |
| `distributor:{id}:qr:active:{bindType}` | 1 hour | 2 — optional; invalidate on regenerate |

---

## RBAC

| Action | MERCHANT_OWNER | MERCHANT_STAFF |
|--------|----------------|----------------|
| View performance / commissions | ✓ | ✓ |
| Generate / regenerate QR | ✓ | ✗ |
| Set QR expiry | ✓ | ✗ |
| Distributor CRUD | ✓ | ✓ (existing) |

Extend Phase 1 `RolesGuard` pattern on QR POST routes.

---

## Implementation Order

| Order | Slice | Stories | Backend | Frontend | Shared |
|-------|-------|---------|---------|----------|--------|
| **1** | Store customer bind | US-4.1, G-7 | `claimCustomer`, store controller, `generateQr` URL fix, cart hydrate | Store bind page → new endpoint | `distributors.ts` (verify, claim) |
| **2** | QR management | US-4.4, US-4.8 | `revokedAt` migration, history, download | Distributor QR panel, bindType picker | `QrHistoryEntry`, `GenerateQrResponse` |
| **3** | Merchant visibility | US-4.2, US-4.3 | `merchant/commissions/*`, performance endpoint | Distributor dashboard, statements page | `CommissionStatementRow`, `DistributorPerformanceSummary` |
| **4** | Platform admin | US-4.5 | `platform/dashboard`, merchant detail enrich | Admin dashboard, merchant detail | `PlatformDashboardStats` |
| **5** | P1 polish | US-4.6, US-4.7 | Email jobs, order/binding enrichment | Activity widget, order distributor column | Job payload types |

**Parallelism after Slice 1:** Slices 2 and 3 can proceed in parallel once store bind e2e is green. Slice 4 is independent of 2–3.

---

## ADRs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Store claim routing | New `POST /store/:slug/bindings/claim` + `StoreAuthGuard` | Clean JWT audience separation; avoids dual-guard claim endpoint |
| Verify shape | Single public endpoint; enriched payload | Store and merchant UIs share verify; invalid tokens return `{ valid: false }` not 404 |
| QR invalidation scope | Per `bindType` on regenerate | MERCHANT and CUSTOMER campaigns can coexist |
| QR expiry | 1–90 days, default 7 | PRD default; cap prevents unbounded tokens |
| Commission payout visibility | Platform `SETTLED` only | No merchant-local “paid out” flag; avoids reconciliation drift |
| Analytics | Compute-on-read + optional Redis | Sufficient at Phase 4 scale; materialized views deferred |
| In-app notifications P1 | Dashboard widget only | Product open question; avoids new persistence layer |
| Re-bind / transfer | Out of scope | `@@unique([bindableType, bindableId])` — conflict returns 409 |
| Hierarchy (US-4.9) | Deferred P2 | No schema change in Phase 4 |

---

## Error Shape

Unchanged from Phase 1. Bind-specific messages:

| Code | Message |
|------|---------|
| `409` | `You are already bound to another distributor` |
| `400` | `This link is for merchant partners, not customers` (wrong portal) |
| `400` | `This link is for customers. Use the store app to bind.` (merchant claim on CUSTOMER token) |

---

## Test Strategy

| Area | Tests |
|------|-------|
| US-4.1 | `bindings.e2e-spec.ts` — CUSTOMER claim, conflict, cart attribution, checkout commission |
| US-4.4 | QR regenerate revokes same bindType only; verify rejects revoked |
| US-4.2/3 | Commission list filters; performance aggregates match seed data |
| US-4.5 | Platform dashboard counts |
| E2E UI | Playwright: store bind → login → claim → checkout → ledger |

---

## Open Questions (resolved / remaining)

| # | Question | Resolution |
|---|----------|------------|
| 1 | Revoke all tokens or same bindType? | **Same bindType only** |
| 2 | Max QR expiry | **1–90 days**, default 7 |
| 3 | Merchant local “paid out”? | **No** — `SETTLED` from platform only |
| 4 | In-app notifications P1 | **Dashboard widget**; inbox deferred |
| 5 | Performance dashboard placement | **Per-distributor detail** P0; tenant-wide summary P1 (UI designer) |
| 6 | Email recipients | **Owner only** P1; configurable list deferred |
| 7 | US-4.9 hierarchy pilot | **Deferred P2** unless stakeholder escalates |

---

## Related Documents

| Document | Path |
|----------|------|
| PRD | `docs/prd/phase-4-distributor-enhancements.md` |
| Phase 1 bindings | `docs/architecture/phase-1-foundation.md` |
| Phase 2 commission | `docs/architecture/phase-2-ecommerce.md` |
| Test handoff G-7 | `docs/handoffs/loop-test-report.md` |
| Shared contracts | `packages/shared/src/distributors.ts` |
