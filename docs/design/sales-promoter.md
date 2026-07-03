# Sales Promoter (拓店员) — Design

**Updated:** 2026-07-03

## Admin — Distributors (拓店员)

### List `/distributors`

- Nav label: 拓店员 / Sales promoters
- Columns unchanged; show linked user email when `accountId` set

### Create dialog

- Primary: search `PlatformAccount` (debounced `/platform/users?search=`)
- Secondary fields: commission rate/type (auto-fill name/email/phone from account)
- Submit → `POST /platform/distributors` with `accountId`

### Detail `/distributors/[id]`

- Hero: recruited count, commission rate, linked account email
- Invite card: copy `{STORE}/open-shop?invite=CODE`
- Tabs: **Profile** | **Promoted stores** (branches table) | **Order commission** (ledger table with 首单/次单 badge)

## Store — Open shop `/open-shop`

### Layout

- `AuthLayout` + `AuthToolbar` (match `/login`, `/register`)
- Query `?invite=` required; invalid → error state with link home

### Wizard

1. **Invite** — show promoter name from `GET .../invite/:code`
2. **Auth gate** — if no `store_token`, buttons to `/login` and `/register` with `from` preserving invite
3. **Business info** — businessName, legalName, contactPhone, terms checkbox
4. **Submit** → `POST /store/merchant-applications` → redirect `/open-shop/pending`

### Pending `/open-shop/pending`

- Message: application submitted; login to merchant portal after approval

### Home CTA

- `StorePicker` tile: 「我要开店」→ `/open-shop`

## i18n

- `packages/shared/src/i18n/messages/*/admin.ts` — distributor → 拓店员 labels
- `packages/shared/src/i18n/messages/*/store.ts` — `openShop.*` keys
