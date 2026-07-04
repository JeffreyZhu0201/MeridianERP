-- CreateTable
CREATE TABLE "ProcurementReceivingAddress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementReceivingAddress_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "BranchPurchaseOrder" ADD COLUMN     "receivingAddressId" TEXT,
ADD COLUMN     "receivingAddressSnapshot" JSONB;

-- CreateIndex
CREATE INDEX "ProcurementReceivingAddress_tenantId_isActive_idx" ON "ProcurementReceivingAddress"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "ProcurementReceivingAddress_tenantId_isDefault_idx" ON "ProcurementReceivingAddress"("tenantId", "isDefault");

-- AddForeignKey
ALTER TABLE "ProcurementReceivingAddress" ADD CONSTRAINT "ProcurementReceivingAddress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPurchaseOrder" ADD CONSTRAINT "BranchPurchaseOrder_receivingAddressId_fkey" FOREIGN KEY ("receivingAddressId") REFERENCES "ProcurementReceivingAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
