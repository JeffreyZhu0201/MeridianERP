-- CreateEnum
CREATE TYPE "CommissionSource" AS ENUM ('ALLOCATION', 'RETAIL');

-- AlterTable
ALTER TABLE "MerchantProfile" ADD COLUMN "isFlagship" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN "unitWholesalePrice" DECIMAL(12,2);

-- AlterTable CommissionLedger: make orderId optional, add allocation fields
ALTER TABLE "CommissionLedger" ALTER COLUMN "orderId" DROP NOT NULL;

ALTER TABLE "CommissionLedger" ADD COLUMN "allocationOrderId" TEXT;
ALTER TABLE "CommissionLedger" ADD COLUMN "merchantAllocationSequence" INTEGER;
ALTER TABLE "CommissionLedger" ADD COLUMN "commissionSource" "CommissionSource" NOT NULL DEFAULT 'RETAIL';

UPDATE "CommissionLedger" SET "commissionSource" = 'RETAIL' WHERE "orderId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CommissionLedger_allocationOrderId_key" ON "CommissionLedger"("allocationOrderId");

-- AddForeignKey
ALTER TABLE "CommissionLedger" ADD CONSTRAINT "CommissionLedger_allocationOrderId_fkey" FOREIGN KEY ("allocationOrderId") REFERENCES "AllocationOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Flagship: HQ tenant (demo branch is not flagship)
UPDATE "MerchantProfile" SET "isFlagship" = true
WHERE "tenantId" IN (SELECT "id" FROM "Tenant" WHERE "slug" = 'hq');
