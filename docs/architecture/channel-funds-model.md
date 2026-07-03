# Channel & Funds Model — Architecture

**Updated:** 2026-07-03

## Commission trigger

| Event | Before | After |
|-------|--------|-------|
| `AllocationOrder` → `CONFIRMED` | — | `CommissionService.accrueOnAllocationConfirmed` (max 2 per tenant, `ALLOCATION`) |
| Order → `FULFILLED` | `accrueOnFulfilled` (RETAIL, 2 orders/customer) | **Disabled** |

Lookup: `MerchantProfile.recruitedByDistributorId` → platform `Distributor` (`tenantId: null`, `isActive`).

## Schema changes

- `MerchantProfile.isFlagship Boolean @default(false)`
- `CommissionSource` enum: `ALLOCATION` | `RETAIL`
- `CommissionLedger`: optional `orderId`, optional `allocationOrderId @unique`, `merchantAllocationSequence`, `commissionSource`
- `OrderLine.unitWholesalePrice Decimal?` — snapshot at checkout from `MasterSku.wholesalePrice`

## Funds formulas (`packages/shared/src/fund-formulas.ts`)

- `pickupOrderGrossProfit(lines, orderTotal)`
- `computeBranchNetPosition({ pickupGrossProfit, allocationCost, deliveryCost })` — no retail `payableCommission`
- Platform summary: `consumerGmv`, `wholesaleFromAllocations`, `wholesaleFromDelivery`, allocation commission accrued/settled

## Deprecated

- `BindingsService.claimCustomer`, store bind pages, CUSTOMER QR
- `Cart.distributorId` business use (column retained)
- `CommissionService.accrueOnFulfilled` for new accruals

## API changes

- `GET /store/stores` — `isFlagship`, filter `storePublished`, sort flagship first
- `GET /merchant/funds/summary` — `pickupGmv`, `pickupCostOfGoods`, `pickupGrossProfit`; remove `payableCommission`
- `GET /platform/funds/summary` — renamed/clarified fields per PRD
