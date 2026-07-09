<!--
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-07-07 09:01:46
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-09 22:42:58
 * @FilePath: /MeridianERP/README.md
 * @Description:
 *
 * Copyright (c) 2026 by 重庆大学音像出版社有限公司, All Rights Reserved.
-->

# MeridianERP

**Version:** v1.1.0 (Phase 5 + AI diagnosis + mock payout)  
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

| Service     | Path               | URL                                                      |
| ----------- | ------------------ | -------------------------------------------------------- |
| Landing     | `apps/landing`     | [····](http://localhost:3004)                            |
| Admin       | `apps/admin`       | [http://localhost:3000](http://localhost:3000)           |
| API         | `apps/api`         | [http://localhost:3001](http://localhost:3001)           |
| Merchant    | `apps/merchant`    | [http://localhost:3002](http://localhost:3002)           |
| Store       | `apps/store`       | [http://localhost:3003/shop](http://localhost:3003/shop) |
| Distributor | `apps/distributor` | [http://localhost:3005](http://localhost:3005)           |

## Commands

| Command                            | Purpose                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `rtk pnpm dev`                     | Start API and all portals through Turborepo                                          |
| `rtk pnpm dev:api`                 | Start API only                                                                       |
| `rtk pnpm dev:landing`             | Start product landing page only                                                      |
| `rtk pnpm dev:landing:clean`       | Clear landing `.next` cache and start (fixes stale chunk errors)                     |
| `rtk pnpm dev:merchant`            | Start Merchant only                                                                  |
| `rtk pnpm dev:store`               | Start Store only                                                                     |
| `rtk pnpm dev:distributor`         | Start Distributor only                                                               |
| `rtk pnpm deps`                    | Start local Redis dependency                                                         |
| `rtk pnpm db:setup`                | Generate Prisma client, migrate, and seed                                            |
| `rtk pnpm typecheck`               | Run TypeScript project checks                                                        |
| `rtk pnpm lint`                    | Run workspace lint                                                                   |
| `rtk pnpm build`                   | Build all workspaces                                                                 |
| `rtk pnpm test:e2e`                | Run Playwright UI tests (run `rtk pnpm exec playwright install chromium` once first) |
| `cd apps/api && rtk pnpm test:e2e` | Run API integration tests (172 cases)                                                |

Optional full stack (all six portals + API + Postgres + Redis):

```bash
rtk docker compose -f docker/docker-compose.yml --profile dev up --build
```

## Seed Accounts

| Portal              | URL                                                      | Account                                  | Password                      |
| ------------------- | -------------------------------------------------------- | ---------------------------------------- | ----------------------------- |
| Admin (super)       | [http://localhost:3000](http://localhost:3000)           | `admin@meridian.test`                    | `admin123`                    |
| Admin (finance)     | [http://localhost:3000](http://localhost:3000)           | `finance@meridian.test`                  | `finance123`                  |
| Admin (fulfillment) | [http://localhost:3000](http://localhost:3000)           | `fulfillment@meridian.test`              | `fulfill123`                  |
| Admin (reviewer)    | [http://localhost:3000](http://localhost:3000)           | `reviewer@meridian.test`                 | `review123`                   |
| Merchant            | [http://localhost:3002](http://localhost:3002)           | `demo@merchant.test`                     | `demo1234`                    |
| Store               | [http://localhost:3003/shop](http://localhost:3003/shop) | Guest checkout (fulfillment: Demo Store) | n/a                           |
| Distributor         | [http://localhost:3005](http://localhost:3005)           | `promoter@meridian.test`                 | `promo1234` (after `db:seed`) |

## Demo Walkthrough

After `rtk pnpm db:setup`, use this path for a full showcase:

1. **Store** — [http://localhost:3003/shop](http://localhost:3003/shop): unified HQ catalog, fulfillment from **Demo Store** branch (HQ is not in the branch picker). Add **Starter Widget** to cart and place a **pickup** order.
2. **Merchant** — `demo@merchant.test` / `demo1234`: verify the pickup order, confirm allocation if issued, manage branch inventory.
3. **Admin (fulfillment)** — `fulfillment@meridian.test` / `fulfill123`: [http://localhost:3000/allocations](http://localhost:3000/allocations) for HQ **delivery** ship queue (flagship tenant `hq`).
4. **Admin (super)** — `admin@meridian.test` / `admin123`: [http://localhost:3000/inventory/master-catalog](http://localhost:3000/inventory/master-catalog) for Master SKU and branch allocations.
5. **Merchant AI** — `/inventory/alerts`: generate replenishment analysis (streaming). Then `/inventory/procurement`: click **AI 一键预填** to fill the procurement cart from the latest analysis.
6. **Admin AI** — `/diagnosis`: submit a natural-language ops query and watch the report stream in.

**Seed layout:** `hq` tenant = flagship catalog + HQ delivery; `demo` tenant = showcase branch (`demo@merchant.test`) with low stock (3 units) for AI replenishment demos.

## Documentation Map

| Need                      | Read                                                  |
| ------------------------- | ----------------------------------------------------- |
| Current product state     | `docs/PRODUCT.md`                                     |
| System architecture       | `docs/architecture/system-overview.md`                |
| Admin RBAC roles          | `docs/architecture/admin-rbac.md`                     |
| AI ops diagnosis          | `docs/architecture/ai-diagnosis.md`                   |
| Flagship unified store    | `docs/architecture/flagship-catalog-store.md`         |
| UI design system          | `docs/design/design-system.md`                        |
| Agent execution workflow  | `docs/execution/README.md`                            |
| Git and PR workflow       | `.cursor/rules/core.mdc`                              |
| UI implementation rules   | `.cursor/rules/ui.mdc` and `packages/ui/src/index.ts` |
| Code simplification rules | `.cursor/rules/quality.mdc`                           |
| Historical plans/specs    | `docs/superpowers/`                                   |

## Troubleshooting

| Symptom                                 | Fix                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| Port already in use                     | Stop the process on the port, then restart the relevant `rtk pnpm dev:*` command      |
| API errors or blank dashboards          | Start `rtk pnpm dev:api` and check `NEXT_PUBLIC_API_URL=http://localhost:3001`        |
| Redis connection errors                 | Run `rtk pnpm deps` and confirm Docker is running                                     |
| Missing distributor JWT secret          | Copy `JWT_DISTRIBUTOR_SECRET` from `.env.example` into `.env`                         |
| Frontend styles look wrong              | Rebuild shared packages with `rtk pnpm --filter @meridian/shared build`               |
| Landing `Cannot find module './787.js'` | Stop dev, run `rtk pnpm dev:landing:clean` (do not run `build` while `dev` is active) |
