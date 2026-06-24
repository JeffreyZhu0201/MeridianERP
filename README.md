# MeridianERP

Multi-tenant SaaS ERP platform with CRM, merchant onboarding, distributor QR binding, and (Phase 2) integrated e-commerce.

## Stack

| Layer | Technology |
|-------|------------|
| Admin portal | Next.js + shadcn/ui (`apps/admin`) |
| Merchant portal | Next.js + shadcn/ui (`apps/merchant`) |
| API | NestJS (`apps/api`) |
| Database | PostgreSQL + Prisma |
| Cache / Queue | Redis + BullMQ |
| Monorepo | pnpm workspaces + Turborepo |

## Repository structure

```
apps/admin/       Super admin ERP (port 3000)
apps/merchant/    Merchant portal (port 3002)
apps/api/         NestJS API (port 3001)
packages/shared/  Shared types and enums
packages/ui/      Shared shadcn shells (planned)
docs/             PRD, architecture, design, execution guides
.cursor/          Agent rules and subagents
docker/           Compose and Dockerfiles (planned)
```

## Development status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Auth, CRM, onboarding, distributor QR | In progress |
| 2 | E-commerce store, commission settlement | Planned |
| 3 | Inventory, reports, advanced ERP | Planned |

### Loop progress (agent-driven)

| Loop | Date | Completed | Next |
|------|------|-----------|------|
| 1 | 2025-06-24 | Monorepo root scaffold, `@meridian/shared` enums, agent docs | NestJS API scaffold (Task 2) |

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm --filter @meridian/shared build
```

Full local stack (after Docker scaffold):

```bash
docker compose --profile dev up
```

## Documentation

| Doc | Path |
|-----|------|
| Platform spec | [docs/superpowers/specs/2025-06-24-meridianerp-platform-design.md](docs/superpowers/specs/2025-06-24-meridianerp-platform-design.md) |
| Phase 1 PRD | [docs/prd/phase-1-foundation.md](docs/prd/phase-1-foundation.md) |
| Phase 1 architecture | [docs/architecture/phase-1-foundation.md](docs/architecture/phase-1-foundation.md) |
| Implementation plan | [docs/superpowers/plans/2025-06-24-phase-1-foundation.md](docs/superpowers/plans/2025-06-24-phase-1-foundation.md) |
| Execution guide | [docs/execution/README.md](docs/execution/README.md) |
| Design system | [docs/design/design-system.md](docs/design/design-system.md) |

## Agent workflow

Development follows the Cursor agent pipeline documented in `.cursor/rules/workflow-orchestration.mdc`:

1. Product Manager → PRD
2. Architect → architecture + shared contracts
3. UI Designer → Figma + design docs
4. Frontend + Backend (parallel)
5. Test Engineer → verification
6. DevOps Engineer → Docker/CI
7. GitHub → PR with green checks (see `github-workflow.mdc`)

## License

Private — All rights reserved.
