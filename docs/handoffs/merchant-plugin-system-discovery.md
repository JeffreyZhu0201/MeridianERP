# Handoff: Merchant Plugin System — Discovery

**Agent:** product-manager  
**Date:** 2026-07-04  
**Branch:** feature/merchant-plugin-system (from develop)

## Scope

- Wrote PRD with 10 user stories (P0–P2), non-goals, success metrics, and open questions.
- Confirmed scope: CRM + 6 extension plugins; ecommerce core always on; P0 = infra + marketplace + stubs.

## Files

- docs/prd/merchant-plugin-system.md

## Open questions

- CRM data retention on uninstall: P0 keeps DB data, blocks nav/API only.
- All 7 plugins installable in P0 with stub pages for non-CRM.

## Next agent

architect — write docs/architecture/merchant-plugin-system.md and packages/shared/src/plugins.ts
