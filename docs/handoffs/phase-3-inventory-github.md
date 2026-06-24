# Handoff: Phase 3 Inventory — GitHub

**Branch:** feature/phase-3-inventory (base: develop)
**PR:** ready to open → develop
**CI:** pending (run after push)

## Docs

- docs/prd/phase-3-inventory.md
- docs/architecture/phase-3-inventory.md
- docs/design/phase-3-inventory.md
- docs/superpowers/plans/2025-06-24-phase-3-inventory.md
- docs/handoffs/phase-3-inventory-*.md

## Suggested PR title

`feat: Phase 3 warehouse inventory, POs, and merchant UI`

## Test plan

- [ ] US-3.1 Warehouse CRUD + default warehouse
- [ ] US-3.2 Stock levels per variant/warehouse
- [ ] US-3.3 Auditable adjustments (no negative stock)
- [ ] US-3.4 Low-stock alerts
- [ ] US-3.5 Create purchase orders
- [ ] US-3.6 Receive goods against PO
- [ ] US-3.8 Checkout respects sellable qty
- [ ] `pnpm --filter @meridian/api test:e2e` (38 tests)
- [ ] `pnpm build`

## Commands

```bash
rtk git push -u origin feature/phase-3-inventory
rtk gh pr create --base develop --title "feat: Phase 3 warehouse inventory" --body "$(cat <<'EOF'
## Summary
- Warehouse-aware inventory with adjustments, low-stock alerts, and purchase orders
- Merchant inventory UI and platform read-only tenant summary

## Docs
- docs/prd/phase-3-inventory.md
- docs/architecture/phase-3-inventory.md
- docs/design/phase-3-inventory.md

## Test plan
- [x] 38 API e2e tests pass
- [ ] US-3.7 reports (manual UI check)
EOF
)"
```
