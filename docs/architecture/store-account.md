# Store Account — Architecture

**Version:** 1.0.0  
**Updated:** 2026-07-06  
**PRD:** `docs/prd/store-account.md`  
**Design:** `docs/design/store.md`

## Data model

Addresses belong to `PlatformAccount` (global store JWT), not per-tenant `Customer`.

```prisma
model CustomerDeliveryAddress {
  id         String          @id @default(cuid())
  accountId  String
  account    PlatformAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  label      String?
  name       String
  phone      String
  line1      String
  line2      String?
  city       String
  province   String?
  postalCode String?
  isDefault  Boolean         @default(false)
  createdAt  DateTime        @default(now())
  updatedAt  DateTime        @updatedAt

  @@index([accountId])
}
```

## Account resolution

`StoreAuthGuard` JWT `sub` may be `Customer.id` or `PlatformAccount.id`. All account endpoints resolve to `accountId` via:

1. `Customer` lookup → `accountId`
2. Else `PlatformAccount` lookup by `sub`

## API (`StoreAuthGuard`, base `/store/auth`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/addresses` | List addresses; default first |
| POST | `/addresses` | Create; first or `isDefault` clears other defaults |
| PATCH | `/addresses/:id` | Update owned address |
| DELETE | `/addresses/:id` | Delete; promote earliest if default removed |
| PATCH | `/me` | Update `firstName`, `lastName`, `phone` |
| POST | `/change-password` | `{ currentPassword, newPassword }` |

## Shared contracts (`packages/shared/src/store-account.ts`)

- `CustomerDeliveryAddressRow`
- `CreateCustomerDeliveryAddressBody` / `UpdateCustomerDeliveryAddressBody`
- `UpdateStoreCustomerProfileBody` / `ChangeStorePasswordBody`
- `StoreCustomerProfile` extended with `phone: string | null`

## Module layout

```
apps/api/src/store/account/
  store-account-addresses.service.ts
  store-account.controller.ts
  dto/
```

Profile/password methods extend `StoreAuthService`; controller mounted at `store/auth`.

## Default address transaction

Mirror `MerchantProcurementAddressesService`: within `$transaction`, `updateMany` clear `isDefault` on siblings when setting a new default.
