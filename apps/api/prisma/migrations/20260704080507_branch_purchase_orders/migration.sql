-- CreateEnum
CREATE TYPE "BranchPurchaseOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BranchPurchaseOrderPaymentStatus" AS ENUM ('SUCCEEDED', 'FAILED');

-- DropForeignKey
ALTER TABLE "CommissionLedger" DROP CONSTRAINT "CommissionLedger_orderId_fkey";

-- DropIndex
DROP INDEX "Distributor_accountId_idx";

-- AlterTable
ALTER TABLE "CommissionLedger" ALTER COLUMN "commissionSource" SET DEFAULT 'ALLOCATION';

-- CreateTable
CREATE TABLE "BranchPurchaseOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "BranchPurchaseOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "paidAt" TIMESTAMP(3),
    "allocationOrderId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchPurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchPurchaseOrderLine" (
    "id" TEXT NOT NULL,
    "branchPurchaseOrderId" TEXT NOT NULL,
    "masterSkuId" TEXT NOT NULL,
    "quantityOrdered" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "unitWholesalePrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "BranchPurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchPurchaseOrderPayment" (
    "id" TEXT NOT NULL,
    "branchPurchaseOrderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "BranchPurchaseOrderPaymentStatus" NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchPurchaseOrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BranchPurchaseOrder_allocationOrderId_key" ON "BranchPurchaseOrder"("allocationOrderId");

-- CreateIndex
CREATE INDEX "BranchPurchaseOrder_tenantId_status_idx" ON "BranchPurchaseOrder"("tenantId", "status");

-- CreateIndex
CREATE INDEX "BranchPurchaseOrder_tenantId_createdAt_idx" ON "BranchPurchaseOrder"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BranchPurchaseOrder_tenantId_orderNumber_key" ON "BranchPurchaseOrder"("tenantId", "orderNumber");

-- CreateIndex
CREATE INDEX "BranchPurchaseOrderLine_branchPurchaseOrderId_idx" ON "BranchPurchaseOrderLine"("branchPurchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchPurchaseOrderLine_branchPurchaseOrderId_masterSkuId_key" ON "BranchPurchaseOrderLine"("branchPurchaseOrderId", "masterSkuId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchPurchaseOrderPayment_branchPurchaseOrderId_key" ON "BranchPurchaseOrderPayment"("branchPurchaseOrderId");

-- CreateIndex
CREATE INDEX "CommissionLedger_commissionSource_idx" ON "CommissionLedger"("commissionSource");

-- AddForeignKey
ALTER TABLE "CommissionLedger" ADD CONSTRAINT "CommissionLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPurchaseOrder" ADD CONSTRAINT "BranchPurchaseOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPurchaseOrder" ADD CONSTRAINT "BranchPurchaseOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPurchaseOrder" ADD CONSTRAINT "BranchPurchaseOrder_allocationOrderId_fkey" FOREIGN KEY ("allocationOrderId") REFERENCES "AllocationOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPurchaseOrder" ADD CONSTRAINT "BranchPurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPurchaseOrderLine" ADD CONSTRAINT "BranchPurchaseOrderLine_branchPurchaseOrderId_fkey" FOREIGN KEY ("branchPurchaseOrderId") REFERENCES "BranchPurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPurchaseOrderLine" ADD CONSTRAINT "BranchPurchaseOrderLine_masterSkuId_fkey" FOREIGN KEY ("masterSkuId") REFERENCES "MasterSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPurchaseOrderPayment" ADD CONSTRAINT "BranchPurchaseOrderPayment_branchPurchaseOrderId_fkey" FOREIGN KEY ("branchPurchaseOrderId") REFERENCES "BranchPurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
