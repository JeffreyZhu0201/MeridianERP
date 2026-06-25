# Phase 5 Design Handoff

**Date:** 2025-06-25  
**Phase:** 3 — UI Design (ui-designer)  
**Next:** nextjs-frontend + nestjs-backend (after `packages/shared` Phase 5 types)

## Handoff

- **Scope**: Phase 5 HQ ↔ Branch channel UI spec — admin (distributors CRUD, allocations, withdrawals, funds, delivery queue, merchant recruit binding), merchant (funds, replenishment, pickup verify tab; **no distributors nav**), distributor (branches, withdrawals), store (checkout fulfillment picker, confirmation QR/code). Shared composite specs for `OrderListFrame`, `FulfillmentTypeBadge`, `PickupVerifyDialog`, `DeliveryShipDialog`. Ui-spec showcase section added with working demo components.

- **Ui-spec refs**:
  - **Phase 5 — Order fulfillment** (`#phase-5-fulfillment`) — new section
  - `#fulfillment-type-badge`, `#order-list-frame`, `#pickup-verify-dialog`, `#delivery-ship-dialog`
  - Bento Grid / Dashboard — funds dashboards
  - FW-LIST — list pages
  - Data Table, Tabs, Pagination, Input OTP, Alert Dialog, Radio Group, Form Controls

- **Files**:
  - `docs/design/phase-5-hq-branch-channel.md` (new)
  - `docs/handoffs/phase-5-design.md` (this file)
  - `apps/ui-spec/src/app/page.tsx` (Phase 5 showcase section)
  - `apps/ui-spec/src/components/fulfillment-type-badge.tsx` (new)
  - `apps/ui-spec/src/components/order-list-frame.tsx` (new)
  - `apps/ui-spec/src/components/pickup-verify-dialog.tsx` (new)
  - `apps/ui-spec/src/components/delivery-ship-dialog.tsx` (new)
  - `apps/ui-spec/src/components/phase-5-fulfillment-showcase.tsx` (new)
  - **To implement in `packages/ui`:** mirror above four composites under `packages/ui/src/components/orders/`

- **Open questions**:
  1. **Platform invite naming** — UI copy "Branch recruit code" vs "Channel invite" (architecture ADR-5.9 `PlatformMerchantInviteCode`).
  2. **Delivery fee display** at checkout — flat vs calculated; PRD silent; show "fee TBD" or hide until priced.
  3. **QR scan P0** — showcase has Scan button stub; confirm `getUserMedia` + jsQR for merchant verify vs manual OTP-only MVP.
  4. **Merchant replenishment SKU picker** — master SKU list vs tenant product mapping when `masterSkuId` absent.
  5. **Remove merchant `/distributors` routes** — redirect to 404 or dashboard with toast (frontend decision).

- **Next agent**: **nextjs-frontend** — propagate showcase composites to `@meridian/ui`, implement routes per design doc aligned with PRD slices S1–S5; **nestjs-backend** in parallel once shared Zod lands.

## Implementation order (UI)

| Slice | Screens |
|-------|---------|
| S1 | Remove merchant distributors nav; admin distributors list/detail shell |
| S2 | Register invite field; merchant approve recruit `Select`; distributor branches |
| S3 | Admin master SKU, allocations, replenishment; admin + merchant funds Bento |
| S4 | Distributor + admin withdrawals |
| S5 | Store checkout fulfillment; confirmation QR; `OrderListFrame` + verify/ship dialogs |

## Preview

```bash
rtk pnpm --filter @meridian/ui-spec dev
# Scroll to "Phase 5 — Order fulfillment"
```
