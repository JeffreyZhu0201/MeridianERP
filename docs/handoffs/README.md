# Agent Handoffs

Each subagent phase must end with a Handoff file before the next phase starts.

## Naming

```
docs/handoffs/<feature>-<phase>.md
```

Examples:

- `phase-3-inventory-discovery.md` — product-manager
- `phase-3-inventory-architecture.md` — architect
- `phase-3-inventory-design.md` — ui-designer
- `phase-3-inventory-implementation.md` — FE/BE (combined or split)
- `phase-3-inventory-verification.md` — test-engineer
- `phase-3-inventory-shipping.md` — devops-engineer
- `phase-3-inventory-github.md` — PR to develop

## Template

```markdown
# Handoff: <Feature> — <Phase>

**Agent:** product-manager | architect | ui-designer | nextjs-frontend | nestjs-backend | test-engineer | devops-engineer
**Date:** YYYY-MM-DD
**Branch:** feature/<scope>-<name> (from develop)

## Scope
What was completed in this phase.

## Files
- path/to/file.ts
- docs/prd/...

## Open questions
Blockers or decisions needed before the next phase.

## Next agent
Who picks up next (e.g. architect → ui-designer).
```

## GitHub Handoff (Phase 7)

```markdown
# Handoff: <Feature> — GitHub

**Branch:** feature/... (base: develop)
**PR:** <url or ready to open> → develop
**CI:** pending | green | failed
**Docs:** docs/prd/..., docs/architecture/..., docs/design/...
```
