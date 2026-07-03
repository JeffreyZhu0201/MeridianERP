# Channel & Funds Model — Design

**Updated:** 2026-07-03

## Store home (`apps/store`)

- `StorePicker`: after load, `selectedSlug = flagship ?? remembered ?? first`
- Flagship row labeled (i18n `store.home.flagshipBadge`) when `isFlagship`

## Merchant funds (`apps/merchant/app/funds`)

- Replace primary metric emphasis from raw GMV to **pickup gross profit**
- Show: pickup GMV, cost of goods, gross profit, allocation cost, delivery virtual cost, net position

## Admin funds (`apps/admin/app/funds`)

- Consumer GMV, wholesale revenue (alloc + delivery), distributor commission accrued/settled, pickup margin KPI

## Pickup flow (unchanged UX)

- Customer: order confirmation QR (`pickup-fulfillment-card`)
- Merchant: `PickupVerifyDialog` scan or 6-digit code

## Removed surfaces

- `apps/store/app/s/[slug]/bind/[token]`
- Merchant distributor CUSTOMER QR options (merchant distributor routes already 403)
