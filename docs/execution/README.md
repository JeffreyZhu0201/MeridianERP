# MeridianERP Execution Guide

How to build MeridianERP using the Cursor agent workflow.

## Agent Phase Order

Every feature follows this sequence. Do not skip phases.

```
1. product-manager  → docs/prd/<feature>.md
2. architect         → docs/architecture/<feature>.md + packages/shared types
3. ui-designer       → docs/design/<feature>.md + Figma
4. nextjs-frontend + nestjs-backend (parallel, after API contracts exist)
5. test-engineer     → tests + report
6. devops-engineer   → Docker/CI updates
7. GitHub            → PR to develop, CI green, merge feature branch
```

Orchestration rules: `.cursor/rules/workflow-orchestration.mdc` and `.cursor/rules/github-workflow.mdc` (always on).

**Git branching:** `feature/*` → `develop` → `main`. See [git-workflow.md](git-workflow.md).

**Handoffs:** Each phase ends with a Handoff saved to `docs/handoffs/<feature>-<phase>.md`. Template: [handoffs/README.md](handoffs/README.md).

## Phase Gates

Before writing application code for a feature:

- [ ] PRD exists with P0 acceptance criteria (Given/When/Then)
- [ ] Architecture doc exists with Prisma models and API contracts
- [ ] Design doc exists with screen specs and component mapping
- [ ] Shared types defined in `packages/shared`

**Phase 1 foundation docs (pre-approved):**

| Doc | Path |
|-----|------|
| Master spec | `docs/superpowers/specs/2025-06-24-meridianerp-platform-design.md` |
| PRD | `docs/prd/phase-1-foundation.md` |
| Architecture | `docs/architecture/phase-1-foundation.md` |
| Design system | `docs/design/design-system.md` |
| Admin wireframes | `docs/design/phase-1-admin.md` |
| Merchant wireframes | `docs/design/phase-1-merchant.md` |
| Implementation plan | `docs/superpowers/plans/2025-06-24-phase-1-foundation.md` |

## Invoking Subagents

Example prompts:

```
Use the product-manager subagent to draft a PRD for inventory management (Phase 3).

Use the architect subagent to design inventory based on docs/prd/inventory.md.

Use the ui-designer subagent to implement the merchants list per docs/design/phase-1-admin.md.

Use nextjs-frontend and nestjs-backend subagents in parallel to implement CRM per docs/architecture/phase-1-foundation.md.

Use test-engineer to validate Phase 1 against docs/prd/phase-1-foundation.md.

Use devops-engineer to set up Docker Compose for the monorepo.
```

## Cursor Rules Reference

| Rule | Scope | Purpose |
|------|-------|---------|
| `workflow-orchestration.mdc` | Always | Phase order, handoffs |
| `tech-stack.mdc` | Always | Monorepo layout, stack |
| `design-system.mdc` | Always | Fonts, colors, tokens |
| `erp-domain.mdc` | apps/**, packages/shared/** | Tenancy, CRM, distributors |
| `code-standards.mdc` | **/*.{ts,tsx} | Naming, patterns, commits |
| `ui-design.mdc` | apps/admin/**, apps/merchant/** | shadcn, Figma sync |
| `nextjs-frontend.mdc` | apps/admin/**, apps/merchant/** | App Router patterns |
| `nestjs-backend.mdc` | apps/api/** | NestJS, Prisma, BullMQ |
| `testing.mdc` | **/*.spec.ts, e2e/** | Test standards |
| `devops-docker.mdc` | docker/**, Dockerfile* | Containers, CI |
| `github-workflow.mdc` | Always | Branches, PRs, CI gates, `gh` CLI |

## GitHub Shipping

After local phases complete, follow `github-workflow.mdc`:

1. Create branch: `feat/<scope>-<name>` or `fix/<scope>-<name>`
2. Ensure PRD, architecture, and design docs are referenced in the PR
3. Push and open PR with `gh`:

```bash
git push -u origin HEAD
gh pr create --title "feat: short description" --body "$(cat <<'EOF'
## Summary
- ...

## Docs
- docs/prd/...
- docs/architecture/...

## Test plan
- [ ] P0 criterion 1
- [ ] P0 criterion 2
EOF
)"
```

4. Monitor checks: `gh pr checks`
5. Merge only when lint, test, and build are green

## Local Development (after scaffold)

### Prerequisites

- Node.js 20+, pnpm 9+, Docker Desktop (Redis)
- Prisma Postgres database ([console.prisma.io](https://console.prisma.io))

### Architecture

| Component | Where it runs |
|-----------|---------------|
| PostgreSQL | **Prisma Postgres** (managed cloud) |
| Redis | Local Docker (`pnpm deps`) |
| NestJS API | Local (`pnpm dev:api`) |
| Next.js portals | Local (`pnpm dev`) |

### First-time setup

```bash
cp .env.example .env
pnpm install
pnpm --filter @meridian/shared build

# Provision Prisma Postgres
cd apps/api && npx prisma init --db
# Paste DATABASE_URL + DIRECT_DATABASE_URL into root .env

pnpm deps          # Redis only
pnpm db:setup      # generate + migrate + seed
```

### Run all apps locally

```bash
pnpm dev
```

| Service | URL |
|---------|-----|
| API | http://localhost:3001 |
| Admin | http://localhost:3000 |
| Merchant | http://localhost:3002 |
| Store | http://localhost:3003 |

### Run individually

```bash
pnpm dev:api
pnpm dev:admin
pnpm dev:merchant
pnpm dev:store
```

### Full Docker stack (optional)

For CI or production-like integration testing:

```bash
docker compose -f docker/docker-compose.yml --profile dev up --build
```

### Tests

```bash
pnpm test                    # all unit tests
pnpm --filter @meridian/api test:e2e   # API integration
pnpm test:e2e                # Playwright e2e
```

## Definition of Done (per feature)

- [ ] All P0 acceptance criteria pass (manual or automated)
- [ ] Unit tests for business logic
- [ ] API integration tests for endpoints
- [ ] UI matches design doc wireframes
- [ ] No TypeScript errors, linter clean
- [ ] Handoff block written with files touched and open questions

## Definition of Done (Phase 1)

- [ ] Super admin can log in, list merchants, approve/reject
- [ ] Merchant can register, submit, log in after approval
- [ ] CRM CRUD works tenant-scoped
- [ ] Distributor CRUD + QR generation works
- [ ] QR bind flow creates binding + auto-lead
- [ ] Docker Compose brings full stack up
- [ ] All P0 tests pass

## Project Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Auth, CRM, onboarding, distributor QR | **Current** |
| 2 | E-commerce store, catalog, commission settlement | Planned |
| 3 | Inventory, reports, advanced ERP | Planned |
