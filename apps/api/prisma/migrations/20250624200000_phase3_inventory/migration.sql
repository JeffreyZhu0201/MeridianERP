-- Phase 3: Inventory schema extension

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockAdjustmentReason" AS ENUM ('DAMAGE', 'COUNT_CORRECTION', 'RETURN', 'OTHER');

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN "reorderThreshold" INTEGER;

-- CreateTable
CREATE TABLE "TenantInventorySettings" (
    "tenantId" TEXT NOT NULL,
    "defaultReorderThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantInventorySettings_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLevel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" "StockAdjustmentReason" NOT NULL,
    "note" TEXT,
    "quantityDelta" INTEGER NOT NULL,
    "quantityBefore" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "poNumber" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "orderedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderLine" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantityOrdered" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderReceipt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "receivedById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderReceiptLine" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "purchaseOrderLineId" TEXT NOT NULL,
    "quantityReceived" INTEGER NOT NULL,

    CONSTRAINT "PurchaseOrderReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Warehouse_tenantId_idx" ON "Warehouse"("tenantId");

-- CreateIndex
CREATE INDEX "Warehouse_tenantId_isDefault_idx" ON "Warehouse"("tenantId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "StockLevel_warehouseId_variantId_key" ON "StockLevel"("warehouseId", "variantId");

-- CreateIndex
CREATE INDEX "StockLevel_tenantId_idx" ON "StockLevel"("tenantId");

-- CreateIndex
CREATE INDEX "StockLevel_tenantId_warehouseId_idx" ON "StockLevel"("tenantId", "warehouseId");

-- CreateIndex
CREATE INDEX "StockLevel_tenantId_variantId_idx" ON "StockLevel"("tenantId", "variantId");

-- CreateIndex
CREATE INDEX "StockAdjustment_tenantId_createdAt_idx" ON "StockAdjustment"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "StockAdjustment_tenantId_warehouseId_idx" ON "StockAdjustment"("tenantId", "warehouseId");

-- CreateIndex
CREATE INDEX "StockAdjustment_tenantId_variantId_idx" ON "StockAdjustment"("tenantId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_tenantId_poNumber_key" ON "PurchaseOrder"("tenantId", "poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_tenantId_status_idx" ON "PurchaseOrder"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_tenantId_warehouseId_idx" ON "PurchaseOrder"("tenantId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderLine_purchaseOrderId_variantId_key" ON "PurchaseOrderLine"("purchaseOrderId", "variantId");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_purchaseOrderId_idx" ON "PurchaseOrderLine"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderReceipt_tenantId_purchaseOrderId_idx" ON "PurchaseOrderReceipt"("tenantId", "purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderReceipt_purchaseOrderId_createdAt_idx" ON "PurchaseOrderReceipt"("purchaseOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrderReceiptLine_receiptId_idx" ON "PurchaseOrderReceiptLine"("receiptId");

-- CreateIndex
CREATE INDEX "PurchaseOrderReceiptLine_purchaseOrderLineId_idx" ON "PurchaseOrderReceiptLine"("purchaseOrderLineId");

-- AddForeignKey
ALTER TABLE "TenantInventorySettings" ADD CONSTRAINT "TenantInventorySettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderReceipt" ADD CONSTRAINT "PurchaseOrderReceipt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderReceipt" ADD CONSTRAINT "PurchaseOrderReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderReceipt" ADD CONSTRAINT "PurchaseOrderReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderReceiptLine" ADD CONSTRAINT "PurchaseOrderReceiptLine_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "PurchaseOrderReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderReceiptLine" ADD CONSTRAINT "PurchaseOrderReceiptLine_purchaseOrderLineId_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "PurchaseOrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: default inventory settings, warehouse, and stock levels per tenant
INSERT INTO "TenantInventorySettings" ("tenantId", "defaultReorderThreshold", "createdAt", "updatedAt")
SELECT t."id", 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Tenant" t
WHERE NOT EXISTS (
  SELECT 1 FROM "TenantInventorySettings" s WHERE s."tenantId" = t."id"
);

INSERT INTO "Warehouse" ("id", "tenantId", "name", "isDefault", "isActive", "createdAt", "updatedAt")
SELECT
  'wh_' || t."id",
  t."id",
  'Default Warehouse',
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Tenant" t
WHERE NOT EXISTS (
  SELECT 1 FROM "Warehouse" w WHERE w."tenantId" = t."id" AND w."isDefault" = true
);

INSERT INTO "StockLevel" ("id", "tenantId", "warehouseId", "variantId", "quantityOnHand", "createdAt", "updatedAt")
SELECT
  'sl_' || pv."id",
  p."tenantId",
  w."id",
  pv."id",
  pv."inventory",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ProductVariant" pv
JOIN "Product" p ON p."id" = pv."productId"
JOIN "Warehouse" w ON w."tenantId" = p."tenantId" AND w."isDefault" = true
WHERE NOT EXISTS (
  SELECT 1 FROM "StockLevel" sl WHERE sl."warehouseId" = w."id" AND sl."variantId" = pv."id"
);
