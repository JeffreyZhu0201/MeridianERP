# Git & PR Workflow

MeridianERP uses **main / develop / feature** branching. Rule source: `.cursor/rules/core.mdc`.

## Branch model

```
main      ← releases (protected)
  ↑
develop   ← integration (default for new work)
  ↑
feature/* ← short-lived branches
```

| Branch | Merge target | When |
|--------|--------------|------|
| `feature/*` | `develop` | Every feature/fix/chore |
| `develop` | `main` | Phase complete or release |
| `hotfix/*` | `main` + `develop` | Urgent production fix |

## Setup (one-time)

`develop` is the default integration branch. If missing on a fresh clone:

```bash
rtk git checkout main && rtk git pull
rtk git checkout -b develop && rtk git push -u origin develop
```

New work always branches from `develop`.

## Daily development

```bash
rtk git checkout develop && rtk git pull
rtk git checkout -b feature/phase-3-inventory

# implement → test → commit (when user requests)
rtk git push -u origin HEAD
rtk gh pr create --base develop --title "feat: inventory module"
```

### Local checks before PR

```bash
rtk pnpm --filter @meridian/api test:e2e
rtk pnpm test:e2e:store
rtk pnpm build
```

### Playwright debug

```bash
rtk pnpm dev
rtk pnpm test:e2e:ui
rtk pnpm test:e2e:debug -- e2e/phase-2-store.spec.ts
```

## PR template

```markdown
## Summary
- …

## Docs
- docs/prd/...
- docs/architecture/...
- docs/design/...

## Test plan
- [ ] P0 criterion 1
```

## Release to main

When a phase is complete and CI is green:

```bash
rtk gh pr create --base main --head develop --title "release: Phase 3"
```

Merge only after review. Tag on `main` if releasing.
