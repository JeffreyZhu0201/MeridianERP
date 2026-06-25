# Platform Settings — Architecture

## Schema

```prisma
model TenantSettings {
  tenantId              String           @id
  tenant                Tenant           @relation(...)
  defaultCommissionRate Decimal?         @db.Decimal(10, 4)
  defaultCommissionType CommissionType?
  notifyOnBinding       Boolean          @default(true)
  notifyOnCommission    Boolean          @default(true)
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
}

model PlatformSettings {
  id           String   @id @default("singleton")
  platformName String   @default("MeridianERP")
  supportEmail String?
  updatedAt    DateTime @updatedAt
}
```

## API

| Method | Path | Guard | Notes |
|--------|------|-------|-------|
| GET/PATCH | `/merchant/settings` | MerchantAuth | Owner write; Staff read |
| GET/POST/PATCH/DELETE | `/merchant/team` | MerchantOwner | User CRUD |
| GET/PATCH | `/platform/settings` | PlatformAuth | Singleton upsert |

## RBAC

- `MERCHANT_OWNER`: full settings + team
- `MERCHANT_STAFF`: GET settings only

## Integration

- `DistributorsService.create` reads default commission from TenantSettings
- Email queue reads `notifyOnBinding` / `notifyOnCommission` before enqueue
