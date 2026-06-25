# MeridianERP

Multi-tenant SaaS ERP platform with CRM, merchant onboarding, distributor QR binding, and integrated e-commerce.

## Stack

| Layer | Technology |
|-------|------------|
| Admin portal | Next.js + `@meridian/ui` (`apps/admin`, port 3000) |
| Merchant portal | Next.js + `@meridian/ui` (`apps/merchant`, port 3002) |
| Storefront | Next.js + `@meridian/ui` (`apps/store`, port 3003) |
| Distributor portal | Next.js + `@meridian/ui` (`apps/distributor`, port 3005) |
| API | NestJS + Prisma (`apps/api`, port 3001) |
| Database | Prisma Postgres (managed) via Prisma ORM |
| Cache / Queue | Redis (local Docker) + BullMQ (email + commission jobs) |
| Payments | Stripe (mock mode when `STRIPE_SECRET_KEY` contains `mock`) |
| Monorepo | pnpm workspaces + Turborepo |

## Repository structure

```
apps/admin/       Super admin ERP (port 3000)
apps/merchant/    Merchant portal (port 3002)
apps/store/       Consumer storefront (port 3003)
apps/distributor/ Distributor self-service portal (port 3005)
apps/api/         NestJS API (port 3001)
apps/ui-spec/     Component showcase (optional, port 3004)
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
| 4 | Distributor channel (bind, QR, commissions, platform metrics) | **Complete** |

## Quick start

### Prerequisites

- Node.js 22+, pnpm 9.15
- Docker Desktop (Redis for local dev; Postgres optional)
- Database: [Prisma Postgres](https://console.prisma.io) **or** local Docker Postgres (see below)

### 1. First-time setup

From the repo root:

```bash
cp .env.example .env
pnpm install
pnpm --filter @meridian/shared build
```

**Database (pick one):**

| Option | Steps |
|--------|--------|
| **Prisma Postgres** (recommended) | `cd apps/api && npx prisma init --db` — copy `DATABASE_URL` and `DIRECT_DATABASE_URL` into root `.env` |
| **Local Docker Postgres** | Uncomment the local `DATABASE_URL` lines in `.env` (both URLs identical); skip `DIRECT_DATABASE_URL` if unset |

**Redis + schema:**

```bash
pnpm deps
pnpm db:setup
```

`pnpm deps` starts Redis only (`docker compose … up -d redis`).  
`pnpm db:setup` runs Prisma generate, migrate, and seed.

### 2. Daily development — one terminal per service

**Infrastructure** (once per machine, or after reboot):

```bash
rtk pnpm deps
```

Starts Redis only. For local Postgres: `docker compose -f docker/docker-compose.yml up -d postgres redis`.

**Applications** — open a **separate terminal** for each service you need. Start the API first; portals depend on it.

| Order | Service | Command | URL |
|-------|---------|---------|-----|
| 1 | API | `rtk pnpm dev:api` | http://localhost:3001 |
| 2 | Admin | `rtk pnpm dev:admin` | http://localhost:3000 |
| 3 | Merchant | `rtk pnpm dev:merchant` | http://localhost:3002 |
| 4 | Store | `rtk pnpm dev:store` | http://localhost:3003/s/demo |
| 5 | Distributor | `rtk pnpm dev:distributor` | http://localhost:3005 |
| — | UI spec (optional) | `rtk pnpm dev:ui-spec` | http://localhost:3004 |

Copy-paste **one command per line**. Shell comments on the same line are passed as CLI args and break Next.js:

```bash
# wrong — Next.js receives "#" and Chinese text as directories
rtk pnpm dev:admin    # 3000

# correct
rtk pnpm dev:admin
```

**Do not** use `pnpm dev` for day-to-day work — it runs Turborepo and starts every app in one process tree. Use the per-service commands above.

**Locale:** Header language toggle (EN / 中文); preference stored in `meridian_locale_<portal>` cookie. Messages live in `packages/shared/src/i18n/`.

### Seed logins

| Portal | Email | Password |
|--------|-------|----------|
| Admin | `admin@meridian.test` | `admin123` |
| Merchant (demo tenant) | `demo@merchant.test` | `demo1234` |
| Store | Register at `/s/demo/register` or use merchant-created customers |

Frontends read `NEXT_PUBLIC_API_URL` from root `.env` (default `http://localhost:3001`). Per-app overrides: `apps/admin/.env.local`, etc. — see `*.env.local.example`.

### Optional: local Docker Postgres

```bash
docker compose -f docker/docker-compose.yml up -d postgres redis
```

Set both `DATABASE_URL` and `DIRECT_DATABASE_URL` in `.env` to  
`postgresql://meridian:meridian@localhost:5432/meridian`, then `pnpm db:setup`.

### Docker (full stack — CI / production-like)

Runs postgres, redis, api, and all frontends in containers:

```bash
docker compose -f docker/docker-compose.yml --profile dev up --build
```

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| Port 3000/3001/3002/3003 won’t open | Run that service’s `rtk pnpm dev:*` in its **own** terminal |
| Page hangs or never loads | `lsof -i :3000` then `kill <PID>`; restart `rtk pnpm dev:admin` |
| `Invalid project directory … /#` | Comment on same line as command — use `rtk pnpm dev:admin` alone |
| API errors / empty dashboards | Start `rtk pnpm dev:api` first; `NEXT_PUBLIC_API_URL=http://localhost:3001` |
| `JWT_DISTRIBUTOR_SECRET` missing | Add to `.env` from `.env.example`, restart API |
| Redis connection errors | `rtk pnpm deps` and confirm Docker is running |

### Verification

```bash
pnpm --filter @meridian/api test:e2e    # 97 API e2e tests (mock Prisma; use --runInBand locally)
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

## Gaps epic deliverables (2025-06)

| Area | Routes / notes |
|------|----------------|
| Admin merchant filters | `GET /platform/merchants?status=&search=` + pagination UI |
| Merchant dashboard | `GET /merchant/dashboard` + activity feed |
| Store orders | `GET /store/:slug/orders`, account + confirmation pages |
| Stripe checkout | Payment Element (live) + simulate (mock) |
| Settings | `GET/PATCH /merchant/settings`, `/merchant/team`, `/platform/settings` |
| Email queue | BullMQ `email` queue — welcome, binding, commission, order confirmation |
| Stock transfers | `POST/GET /merchant/inventory/transfers` + merchant UI |
| Distributor portal | `apps/distributor` (3005), `JWT_DISTRIBUTOR_SECRET` |
| Seed | `PlatformSettings` singleton + demo `TenantSettings` |

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
