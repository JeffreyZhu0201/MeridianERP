# Git & PR Workflow

MeridianERP follows agent-phase gates before shipping. Rule source: `.cursor/rules/github-workflow.mdc`.

## Branch strategy

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<scope>-<name>` | `feat/phase-2-store` |
| Fix | `fix/<scope>-<name>` | `fix/store-product-grid` |
| Chore | `chore/<name>` | `chore/prisma-postgres` |

`main` is protected — never force-push.

## Development loop

```
1. Branch from main
2. Implement (nestjs-backend / nextjs-frontend)
3. Run tests locally
4. Commit on feature branch
5. Push + open PR
6. CI green → merge
```

### Local checks before PR

```bash
pnpm --filter @meridian/api test:e2e   # API integration (mock Prisma)
pnpm test:e2e:store                    # Playwright store smoke
pnpm build                             # all apps compile
```

### Playwright debug

```bash
pnpm dev                               # API + frontends (or reuse running stack)
pnpm test:e2e:ui                       # interactive UI mode
pnpm test:e2e:debug -- e2e/phase-2-store.spec.ts   # step-through debugger
pnpm exec playwright show-report       # open last HTML report
```

Use Cursor **Browser** (@Browser) to inspect pages while `pnpm dev` is running.

## PR phase gate

Do **not** open a PR until:

- [ ] `docs/prd/<feature>.md` (or approved foundation docs)
- [ ] `docs/architecture/<feature>.md`
- [ ] `docs/design/<feature>.md` (UI changes)
- [ ] `test-engineer` report mapped to P0 criteria

## PR template

```markdown
## Summary
- <why, 1-3 bullets>

## Docs
- docs/prd/...
- docs/architecture/...
- docs/design/...

## Test plan
- [ ] P0 criterion 1
- [ ] P0 criterion 2
```

```bash
git push -u origin HEAD
gh pr create --title "feat: short description" --body "$(cat <<'EOF'
## Summary
- ...

## Docs
- ...

## Test plan
- [ ] ...
EOF
)"
gh pr checks
```

## Commit conventions

- `feat:` new capability
- `fix:` bug fix
- `chore:` tooling, docs, CI
- `test:` test-only changes

One logical change per commit. Only commit when explicitly requested.

## Current repo state (Phase 2 complete)

Recommended next PR split:

| PR | Branch | Scope |
|----|--------|-------|
| 1 | `feat/phase-1-foundation` | Phase 1 apps, API auth, CRM |
| 2 | `feat/phase-2-ecommerce` | Store, catalog, checkout, commission |
| 3 | `chore/dev-infra` | Docker, CI, Playwright, Prisma Postgres docs |

Or a single `feat/phase-1-2-foundation` if you prefer one merge.

## Handoff block (end of each feature)

```
## GitHub Handoff
- **Branch**: feat/...
- **PR**: <url or ready to open>
- **CI**: pending | green | failed
- **Docs**: docs/prd/..., docs/architecture/..., docs/design/...
```
