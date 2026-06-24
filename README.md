# MeridianERP

Multi-tenant SaaS ERP platform with CRM, merchant onboarding, distributor QR binding, and integrated e-commerce.

## Stack

| Layer | Technology |
|-------|------------|
| Admin portal | Next.js + `@meridian/ui` (`apps/admin`, port 3000) |
| Merchant portal | Next.js + `@meridian/ui` (`apps/merchant`, port 3002) |
| Storefront | Next.js + `@meridian/ui` (`apps/store`, port 3003) |
| API | NestJS + Prisma (`apps/api`, port 3001) |
| Database | Prisma Postgres (managed) via Prisma ORM |
| Cache / Queue | Redis (local Docker) + BullMQ (email + commission jobs stubbed) |
| Payments | Stripe (mock mode when `STRIPE_SECRET_KEY` contains `mock`) |
| Monorepo | pnpm workspaces + Turborepo |

## Repository structure

```
apps/admin/       Super admin ERP (port 3000)
apps/merchant/    Merchant portal (port 3002)
apps/store/       Consumer storefront (port 3003)
apps/api/         NestJS API (port 3001)
packages/shared/  Shared types and enums
packages/ui/      Shared shells, tables, forms
docs/             PRD, architecture, design, execution guides
docker/           Compose + Dockerfiles
e2e/              Playwright smoke tests
```

## Development status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Auth, CRM, onboarding, distributor QR | **Complete** |
| 2 | E-commerce store, commission settlement | **Complete** |
| 3 | Inventory, warehouses, purchase orders | **Complete** |

## Quick start

### Prerequisites

- Node.js 22+, pnpm 9.15
- Docker Desktop (Redis only for local dev)
- [Prisma Data Platform](https://console.prisma.io) account (managed Postgres)

### Recommended: Prisma Postgres + local apps

Database is **Prisma-hosted**; API and Next.js portals run **locally** (not in Docker).

```bash
cp .env.example .env
pnpm install
pnpm --filter @meridian/shared build

# 1. Provision Prisma Postgres (first time only)
cd apps/api && npx prisma init --db
# Copy DATABASE_URL + DIRECT_DATABASE_URL into root .env

# 2. Start Redis (only local infra dependency)
pnpm deps

# 3. Migrate & seed Prisma Postgres
pnpm db:setup

# 4. Start API + all frontends (one terminal)
pnpm dev
```

| Service | URL |
|---------|-----|
| API | http://localhost:3001 |
| Admin | http://localhost:3000 |
| Merchant | http://localhost:3002 |
| Store | http://localhost:3003/s/demo |

**Seed credentials:** `admin@meridian.test` / `admin123`

Run services individually if preferred: `pnpm dev:api`, `pnpm dev:admin`, `pnpm dev:merchant`, `pnpm dev:store`.

### Optional: local Docker Postgres

For offline development without Prisma Postgres, uncomment the local `DATABASE_URL` in `.env` and omit `DIRECT_DATABASE_URL`:

```bash
docker compose -f docker/docker-compose.yml up -d postgres redis
pnpm db:setup
pnpm dev
```

### Docker (full stack — CI / production-like)

Runs postgres, redis, api, and all frontends in containers:

```bash
docker compose -f docker/docker-compose.yml --profile dev up --build
```

### Verification

```bash
pnpm --filter @meridian/api test:e2e    # 25 API e2e tests (mock Prisma)
pnpm test:e2e                           # Playwright (admin + store projects)
pnpm test:e2e:ui                        # interactive debug UI
pnpm test:e2e:debug -- e2e/phase-2-store.spec.ts
```

## Phase 3 deliverables

| Area | Endpoints / routes |
|------|-------------------|
| Merchant inventory | `/api/v1/merchant/inventory/*` — settings, warehouses, stock-levels, adjustments, low-stock, POs, reports + CSV |
| Platform inventory | `GET /api/v1/platform/inventory/tenants/:tenantId/*` (read-only) |
| Checkout | Sellable qty + decrement via `InventoryService` (default warehouse) |
| Merchant UI | `/inventory/warehouses`, `/stock`, `/adjustments`, `/alerts`, `/purchase-orders`, `/reports`, `/settings` |
| Admin UI | `/inventory/tenants/[tenantId]` |
| Demo seed | Default Warehouse + stock levels for `demo` tenant (`DEMO-001`: 100 units) |

## Phase 2 deliverables

| Area | Endpoints / routes |
|------|-------------------|
| Store auth | `POST /api/v1/store/:slug/auth/register`, `login` |
| Store catalog | `GET /api/v1/store/:slug/products`, `products/:slug` |
| Cart & checkout | `/api/v1/store/:slug/cart`, `checkout`, Stripe webhook |
| Merchant catalog | CRUD `/api/v1/merchant/products`, `/categories` |
| Merchant orders | `GET /api/v1/merchant/orders` |
| Commission | Accrual on PAID → `CommissionLedger` |
| Platform | `GET /platform/orders`, `/settlements`, `POST settlements/export` |
| Store UI | `/s/[slug]/` products, cart, checkout, login, register |
| Merchant UI | `/catalog/products`, `/catalog/categories` |
| Admin UI | `/orders`, `/settlements` |

## Documentation

| Doc | Path |
|-----|------|
| Platform spec | [docs/superpowers/specs/2025-06-24-meridianerp-platform-design.md](docs/superpowers/specs/2025-06-24-meridianerp-platform-design.md) |
| Phase 1 PRD | [docs/prd/phase-1-foundation.md](docs/prd/phase-1-foundation.md) |
| Phase 2 PRD | [docs/prd/phase-2-ecommerce.md](docs/prd/phase-2-ecommerce.md) |
| Phase 2 architecture | [docs/architecture/phase-2-ecommerce.md](docs/architecture/phase-2-ecommerce.md) |
| Phase 2 store design | [docs/design/phase-2-store.md](docs/design/phase-2-store.md) |
| Phase 2 implementation plan | [docs/superpowers/plans/2025-06-24-phase-2-ecommerce.md](docs/superpowers/plans/2025-06-24-phase-2-ecommerce.md) |
| Phase 3 PRD | [docs/prd/phase-3-inventory.md](docs/prd/phase-3-inventory.md) |
| Phase 3 architecture | [docs/architecture/phase-3-inventory.md](docs/architecture/phase-3-inventory.md) |
| Phase 3 design | [docs/design/phase-3-inventory.md](docs/design/phase-3-inventory.md) |
| **Phase 3 implementation plan** | [docs/superpowers/plans/2025-06-24-phase-3-inventory.md](docs/superpowers/plans/2025-06-24-phase-3-inventory.md) |
| Execution guide | [docs/execution/README.md](docs/execution/README.md) |
| **Git & PR workflow** | [docs/execution/git-workflow.md](docs/execution/git-workflow.md) |

## License

Private — All rights reserved.
