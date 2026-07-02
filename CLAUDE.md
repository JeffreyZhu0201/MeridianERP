# CLAUDE.md

## Start Here

MeridianERP is a multi-tenant SaaS ERP for factory HQ, branch merchants, B2B distributors, and consumer storefronts. Use this file as a short index only; do not duplicate the detailed rules here.

## Non-Negotiables

- Follow `.cursor/rules/core.mdc` for RTK commands, phase gates, branching, PR rules, and commit policy.
- Prefix terminal commands with `rtk` unless the command is interactive or the user asks for raw output.
- Do not commit unless the user explicitly asks.
- Do not implement a new feature without PRD and architecture docs unless the user asks for a small maintenance edit.
- UI work uses `packages/ui` and `.cursor/rules/ui.mdc`; do not use Figma workflows for this repo.

## Project Map

- `apps/admin` - platform HQ portal on 3000.
- `apps/api` - NestJS API on 3001.
- `apps/merchant` - branch merchant portal on 3002.
- `apps/store` - consumer storefront on 3003.
- `apps/distributor` - distributor portal on 3005.
- `packages/shared` - shared DTOs, enums, schemas, and business types.
- `packages/ui` - shared shells, layouts, shadcn/ui primitives, and design tokens.
- `apps/api/prisma/schema.prisma` - canonical database schema.

## Canonical References

- Current product state: `docs/PRODUCT.md`.
- Architecture overview: `docs/architecture/system-overview.md`.
- Design system detail: `docs/design/design-system.md`.
- Execution workflow: `docs/execution/README.md`.
- Handoff template: `docs/handoffs/README.md`.
- UI exports: `packages/ui/src/index.ts`.

## Frequent Commands

```bash
rtk pnpm deps
rtk pnpm dev
rtk pnpm dev:api
rtk pnpm db:setup
rtk pnpm typecheck
rtk pnpm build
```

## Troubleshooting Pointers

- Startup commands and seed accounts: `README.md`.
- Product status or feature scope: `docs/PRODUCT.md`.
- API/module/data-model questions: `docs/architecture/system-overview.md` and matching `docs/architecture/<feature>.md`.
- UI patterns: `packages/ui/src/index.ts`, `packages/ui/src/components/ui/`, and `docs/design/design-system.md`.
