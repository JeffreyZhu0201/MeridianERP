# MeridianERP

**Version:** v1.0.0 (Phase 5 complete)  
**Project:** QTWBJFXT20250904

## What This Is

MeridianERP is a multi-tenant SaaS ERP for factory HQ, branch merchants, B2B distributors, and consumer storefronts. It combines CRM, allocation and replenishment, inventory, commission settlement, order fulfillment, and AI-assisted operations diagnosis.

## Quick Start

Requirements: Node.js 22+, pnpm 9.15+, Docker Desktop.

```bash
cp .env.example .env
rtk pnpm install
rtk pnpm --filter @meridian/shared build
rtk pnpm deps
rtk pnpm db:setup
rtk pnpm dev
```

The local `.env.example` is configured for the Docker-backed development stack. Do not append shell comments on the same line as `pnpm dev:*` commands.

## Services

| Service | Path | URL |
|---|---|---|
| Admin | `apps/admin` | http://localhost:3000 |
| API | `apps/api` | http://localhost:3001 |
| Merchant | `apps/merchant` | http://localhost:3002 |
| Store | `apps/store` | http://localhost:3003/s/demo |
| Distributor | `apps/distributor` | http://localhost:3005 |

## Commands

| Command | Purpose |
|---|---|
| `rtk pnpm dev` | Start API and all portals through Turborepo |
| `rtk pnpm dev:api` | Start API only |
| `rtk pnpm dev:admin` | Start Admin only |
| `rtk pnpm dev:merchant` | Start Merchant only |
| `rtk pnpm dev:store` | Start Store only |
| `rtk pnpm dev:distributor` | Start Distributor only |
| `rtk pnpm deps` | Start local Redis dependency |
| `rtk pnpm db:setup` | Generate Prisma client, migrate, and seed |
| `rtk pnpm typecheck` | Run TypeScript project checks |
| `rtk pnpm lint` | Run workspace lint |
| `rtk pnpm build` | Build all workspaces |
| `rtk pnpm test:e2e` | Run Playwright tests |

Optional full stack:

```bash
rtk docker compose -f docker/docker-compose.yml --profile dev up --build
```

## Seed Accounts

| Portal | URL | Account | Password |
|---|---|---|---|
| Admin | http://localhost:3000 | `admin@meridian.test` | `admin123` |
| Merchant | http://localhost:3002 | `demo@merchant.test` | `demo1234` |
| Store | http://localhost:3003/s/demo | Register at `/s/demo/register` | n/a |
| Distributor | http://localhost:3005 | Create in Admin -> Distributors | n/a |

## Documentation Map

| Need | Read |
|---|---|
| Current product state | `docs/PRODUCT.md` |
| System architecture | `docs/architecture/system-overview.md` |
| UI design system | `docs/design/design-system.md` |
| Agent execution workflow | `docs/execution/README.md` |
| Git and PR workflow | `.cursor/rules/core.mdc` |
| UI implementation rules | `.cursor/rules/ui.mdc` and `packages/ui/src/index.ts` |
| Historical plans/specs | `docs/superpowers/` |

## Troubleshooting

| Symptom | Fix |
|---|---|
| Port already in use | Stop the process on the port, then restart the relevant `rtk pnpm dev:*` command |
| API errors or blank dashboards | Start `rtk pnpm dev:api` and check `NEXT_PUBLIC_API_URL=http://localhost:3001` |
| Redis connection errors | Run `rtk pnpm deps` and confirm Docker is running |
| Missing distributor JWT secret | Copy `JWT_DISTRIBUTOR_SECRET` from `.env.example` into `.env` |
| Frontend styles look wrong | Rebuild shared packages with `rtk pnpm --filter @meridian/shared build` |
