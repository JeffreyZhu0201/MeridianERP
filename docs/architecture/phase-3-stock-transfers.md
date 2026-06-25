# Stock Transfers — Architecture (US-3.15)

## Model

```prisma
enum StockTransferStatus { COMPLETED CANCELLED }

model StockTransfer {
  id              String @id @default(cuid())
  tenantId        String
  fromWarehouseId String
  toWarehouseId   String
  status          StockTransferStatus @default(COMPLETED)
  note            String?
  createdById     String
  lines           StockTransferLine[]
  createdAt       DateTime @default(now())
}

model StockTransferLine {
  id         String @id @default(cuid())
  transferId String
  variantId  String
  quantity   Int
}
```

## Transaction (create)

1. Validate `from != to`, qty ≤ on-hand at source
2. Decrement source `StockLevel`, increment destination
3. Create `StockAdjustment` rows (TRANSFER_OUT / TRANSFER_IN)
4. Sync variant aggregate inventory

## API

`POST/GET /merchant/inventory/transfers`, `GET :id` — Owner + Staff

## UI

`/inventory/transfers`, `/inventory/transfers/new` — ListPageFrame + FormPageFrame
