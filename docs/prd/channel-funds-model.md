# Channel & Funds Model — Product Requirements

**Status:** In implementation  
**Updated:** 2026-07-03

## Problem

Phase 5 accrued promoter commission on the **first two fulfilled retail orders per customer per branch**. The business requires:

1. End customers **do not** bind to distributors.
2. Promoters earn on the **first two confirmed wholesale allocations** (进货) per recruited branch.
3. Branch **pickup gross profit** = order total minus wholesale cost snapshot.
4. HQ manages **delivery** shipment and platform/branch fund reporting.

## User Stories (P0)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-CF1 | No customer distributor binding | CUSTOMER bind API/UI removed; cart does not hydrate `distributorId` from binding. |
| US-CF2 | Promoter commission on allocation | **Given** branch with `recruitedByDistributorId`, **When** allocation order reaches `CONFIRMED` and is 1st or 2nd commissionable allocation for that tenant, **Then** `CommissionLedger` with `commissionSource=ALLOCATION` and amount = wholesale total × rate. **When** 3rd+ confirmed allocation, **Then** no new ledger. |
| US-CF3 | No retail commission | **Given** fulfilled pickup/delivery order, **Then** no new `RETAIL` commission ledger (legacy rows read-only). |
| US-CF4 | Pickup margin | **Given** pickup order with `unitWholesalePrice` on lines, **When** merchant funds summary is queried, **Then** `pickupGrossProfit` = Σ(order.total − line costs) for FULFILLED pickup orders in range. |
| US-CF5 | HQ delivery | Existing admin delivery queue and `DeliveryAllocationLedger` unchanged; platform funds include delivery wholesale. |
| US-CF6 | Flagship store default | **Given** published store list, **When** customer opens store home, **Then** flagship store is first and pre-selected. |
| US-CF7 | Platform funds | Admin funds summary shows consumer GMV, wholesale from allocations/delivery, allocation-based commission accrued/settled, optional pickup margin KPI. |

## Non-Goals

- Retroactive re-calculation of historical RETAIL commissions
- Merging `Binding(MERCHANT)` with `recruitedByDistributorId`
- Payment gateway payout automation

## Related Documents

- `docs/architecture/channel-funds-model.md`
- `docs/design/channel-funds-model.md`
- `docs/PRODUCT.md`
