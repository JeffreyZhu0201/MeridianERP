# Handoff: Merchant Plugin System — Verification

**Agent:** test-engineer  
**Date:** 2026-07-04  
**Branch:** feature/merchant-plugin-system

## P0 acceptance criteria

| ID | Criterion | Status |
|----|-----------|--------|
| US-MP1 | Owner browses /plugins and installs/uninstalls | Pass (UI + API e2e) |
| US-MP2 | Sidebar reflects installed plugins | Pass (MerchantShell filter + Playwright smoke) |
| US-MP3 | CRM API/page blocked when CRM uninstalled | Pass (403 API, CRM layout redirect) |
| US-MP4 | Admin merchant detail plugin status | Pass (plugins card + Playwright) |
| US-MP5 | Default CRM on approve/create | Pass (e2e + seed backfill) |
| US-MP6 | Stub plugins show EmptyState | Pass (/hrm etc.) |
| US-MP7 | Core modules always visible | Pass (nav config) |

## Tests added

- apps/api/test/merchant-plugins.e2e-spec.ts (6 cases)
- e2e/merchant-plugins.spec.ts (Playwright smoke)

## Commands

```bash
cd apps/api && rtk pnpm test:e2e -- merchant-plugins
rtk pnpm exec playwright test merchant-plugins
```

## Next

Open PR `feature/merchant-plugin-system` → `develop`
