-- AlterTable
ALTER TABLE "DistributorQrCode" ADD COLUMN "revokedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DistributorQrCode_distributorId_bindType_idx" ON "DistributorQrCode"("distributorId", "bindType");
