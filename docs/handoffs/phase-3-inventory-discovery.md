# Handoff: Phase 3 Inventory — Discovery

**Agent:** product-manager  
**Date:** 2025-06-24  
**Branch:** feature/phase-3-inventory (from develop)

## Scope

Phase 1 (Discovery) complete for inventory and warehousing MVP. PRD defines warehouse-aware stock management building on Phase 2's flat `ProductVariant.inventory` and checkout decrement behavior.

**In scope (P0/P1):** Warehouses/locations, per-warehouse stock levels, auditable adjustments, low-stock alerts, basic purchase orders (create + receive), merchant inventory reports, storefront stock validation continuity.

**Explicitly deferred:** Advanced distributor hierarchies, full financial GL, inter-warehouse transfers (P2), platform analytics dashboards, lot/batch tracking.

## Files

- `docs/prd/phase-3-inventory.md`
- `docs/handoffs/phase-3-inventory-discovery.md`

## Open questions

1. Migration strategy: deprecate vs cache `ProductVariant.inventory` relative to warehouse stock sums
2. MVP fulfillment: default warehouse only for storefront decrement
3. PO status machine and partial receive event model
4. Adjustment reason enum vs free text; RBAC split for inventory actions
5. Negative stock / backorder policy
6. Platform admin read scope and audit requirements
7. Tenant default reorder threshold when variant-level unset

## Next agent

**architect** — produce `docs/architecture/phase-3-inventory.md` with domain model, migration plan from Phase 2 inventory field, and checkout integration contract (no API endpoint prescriptiveness in PRD).
