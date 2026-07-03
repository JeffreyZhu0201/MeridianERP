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

- Hero: recruited count, commission rate, linked account email, available balance
- **Funds summary** card: accrued, settled, available, pending withdrawals
- Invite card: copy link + **QR** (`react-qr-code`); history table shows mini QR per active code
- **Withdrawal history** table (latest 10) + link to `/withdrawals?distributorId=`
- Sections: **Profile** | **Promoted stores** | **Order commission**

## Admin — Withdrawals `/withdrawals`

- Status tabs: Pending / Approved / Rejected / All (`?status=`)
- Optional `?distributorId=` filter from promoter detail
- Columns: promoter, amount, status, requested, reviewed, note/rejection
- Pending rows: approve/reject dialogs; processed rows read-only
- Approve copy: disburse confirm (no bank API)

## Distributor portal — Share `/share`

- Nav: 「分享拓店」/ Share & recruit
- Primary CTA: Generate invite code
- Active code panel: 6-char code, copy link, centered QR (`react-qr-code`)
- History table: code, uses, status, revoke action

## Distributor portal — Branches / Commissions / Withdrawals

### Branches `/branches`

- Columns: business, slug, recruited, orders/sales (30d), lifetime orders/sales
- Description notes 30-day window for short-term columns

### Commissions `/commissions`

- KPI header from dashboard `commissionSummary` + available balance
- Table: store, order ref, sequence (首单/次单), order total, commission, status, date

### Withdrawals `/withdrawals`

- Existing apply form + history with status badges (PENDING/APPROVED/REJECTED)

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

- `packages/shared/src/i18n/messages/*/admin.ts` — distributor → 拓店员 labels; withdrawals tabs
- `packages/shared/src/i18n/messages/*/distributor.ts` — `share.*`, portal title 拓店员
- `packages/shared/src/i18n/messages/*/store.ts` — `openShop.*` keys
