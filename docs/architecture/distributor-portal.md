# Distributor Portal — Architecture

## Auth

- `JWT_DISTRIBUTOR_SECRET` env
- Payload: `{ sub: distributorId, aud: 'distributor', tenantId, roles: ['DISTRIBUTOR'] }`
- `DistributorAuthGuard` + `DistributorJwtStrategy`

## Schema additions

```prisma
model Distributor {
  // existing fields...
  passwordHash   String?
  portalEnabled  Boolean   @default(false)
  lastLoginAt    DateTime?
}
```

## API (`/api/v1/distributor`)

| Path | Guard |
|------|-------|
| POST `/auth/login` | Public |
| GET `/me/dashboard` | DistributorAuth |
| GET `/me/commissions` | DistributorAuth |
| GET `/me/bindings` | DistributorAuth |

## Merchant enable API

`POST /merchant/distributors/:id/portal` (Owner) — body: `{ password }`

## App

`apps/distributor` — AuthLayout login, DashboardPageFrame, commissions ListPageFrame
