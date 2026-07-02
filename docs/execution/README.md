# MeridianERP Execution Guide

## Phase Order

Every new feature follows this order unless the user explicitly asks for a small maintenance edit:

1. `product-manager` writes or updates `docs/prd/<feature>.md`.
2. `architect` writes or updates `docs/architecture/<feature>.md` and shared contracts.
3. `ui-designer` writes or updates `docs/design/<feature>.md` for UI changes.
4. `nextjs-frontend` and `nestjs-backend` implement after contracts exist.
5. `test-engineer` verifies P0 acceptance criteria.
6. `devops-engineer` handles Docker, environment, or CI changes when needed.
7. GitHub shipping opens a PR from a feature branch into `develop`.

Core workflow behavior lives in `.cursor/rules/core.mdc`.

## Required Artifacts

Before feature implementation:

- `docs/prd/<feature>.md` with P0/P1/P2 stories and Given/When/Then acceptance criteria.
- `docs/architecture/<feature>.md` with API contracts, data model, module boundaries, jobs, caching, and ADRs.
- `docs/design/<feature>.md` when screens or shared UI change.
- `packages/shared` contracts before frontend and backend run in parallel.

Doc templates and expectations live in `.cursor/rules/planning-docs.mdc`.

## Rule Map

| Rule | Scope |
|---|---|
| `.cursor/rules/core.mdc` | RTK, project map, workflow gates, branch and PR rules |
| `.cursor/rules/ui.mdc` | `packages/ui`, design tokens, accessibility, screen specs |
| `.cursor/rules/frontend.mdc` | Next.js App Router implementation |
| `.cursor/rules/backend.mdc` | NestJS, Prisma, tenancy, shared contracts |
| `.cursor/rules/planning-docs.mdc` | PRD, architecture, and design docs |
| `.cursor/rules/quality.mdc` | TypeScript, naming, imports, tests |
| `.cursor/rules/devops.mdc` | Docker, env, CI, deployment |

## Document Ownership

| Topic | Canonical source |
|---|---|
| Human startup | `README.md` |
| Current product state | `docs/PRODUCT.md` |
| System architecture | `docs/architecture/system-overview.md` |
| UI system | `docs/design/design-system.md` and `packages/ui` |
| Historical context | `docs/archive/`, `docs/handoffs/`, `docs/superpowers/` |

Keep entrypoints short. Move superseded long-form material to `docs/archive/` and leave a pointer at the original path when existing links may depend on it.

## Simplification Work

Code simplification should preserve behavior. Start with shared helpers and docs/rules, then split large files by responsibility. Run `rtk pnpm typecheck` after each phase and focused tests for touched domains.

## Handoffs

Each phase writes a handoff to `docs/handoffs/<feature>-<phase>.md`. Use `docs/handoffs/README.md` for the template.

## GitHub Shipping

Use `.cursor/rules/core.mdc` for branch naming, PR targets, CI expectations, and commit policy. Feature PRs target `develop`; releases flow from `develop` to `main`.

## Current Status

Phase 1-5 are complete. Current product status and active open work live in `docs/PRODUCT.md`.
