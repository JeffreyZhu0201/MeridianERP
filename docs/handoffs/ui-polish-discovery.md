# Handoff: UI Polish (ZH Inventory) — Discovery

**Agent:** product-manager  
**Date:** 2025-06-24  
**Branch:** feature/ui-polish-zh-comments (from develop)

## Scope

Phase 1 (Discovery) complete for merchant inventory UI polish and Simplified Chinese localization. PRD defines a scoped optimization pass—no new inventory features—covering Chinese UI copy, empty states, form validation feedback, data-dense UX alignment, developer Chinese comments on inventory modules, Figma sync for merchant inventory screens, and expanded Playwright E2E (login + all 9 inventory routes).

**In scope (P0):** Chinese labels on all `/inventory/*` pages; Chinese empty states with CTAs; Chinese inline form validation; Playwright route coverage; basic UX density polish per design system.

**In scope (P1):** Chinese code comments on inventory modules; Figma frame sync + design doc links; badge/loading consistency audit.

**Explicitly out of scope:** Full-app i18n framework, admin portal translation, storefront localization, Traditional Chinese, new inventory capabilities.

## Files

- `docs/prd/ui-polish-zh-inventory.md`
- `docs/handoffs/ui-polish-discovery.md`

## Open questions

1. String strategy without i18n — inline vs centralized `inventory-zh.ts` dictionary
2. Playwright selector strategy for Chinese UI (`data-testid` vs localized role names)
3. API error code → Chinese message mapping contract
4. Figma file target (new vs existing merchant library)
5. Whether `packages/shared` inventory types get Chinese comments
6. Catalog product Sheet sellable-qty link — translate or exclude

## Next agent

**architect** — produce `docs/architecture/ui-polish-zh-inventory.md` with string/comment boundaries, E2E test plan hooks, and Figma sync checklist (no prescriptive API changes; inventory behavior unchanged).
