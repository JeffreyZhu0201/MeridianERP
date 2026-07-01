-- DropForeignKey
ALTER TABLE "Distributor" DROP CONSTRAINT "Distributor_tenantId_fkey";

-- CreateTable
CREATE TABLE "RecruiterChangeLog" (
    "id" TEXT NOT NULL,
    "merchantProfileId" TEXT NOT NULL,
    "previousDistributorId" TEXT,
    "newDistributorId" TEXT,
    "reason" TEXT NOT NULL,
    "changedByPlatformUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantRecruitInviteCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantRecruitInviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterSku" (
    "id" TEXT NOT NULL,
    "skuCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "cumulativeShippedQty" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "wholesalePrice" DECIMAL(12,2) NOT NULL,
    "retailPrice" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterSku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "AllocationOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "issuedByPlatformUserId" TEXT,
    "confirmedByUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllocationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationOrderLine" (
    "id" TEXT NOT NULL,
    "allocationOrderId" TEXT NOT NULL,
    "masterSkuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "wholesalePrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "AllocationOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplenishmentRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "ReplenishmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByPlatformUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReplenishmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplenishmentRequestLine" (
    "id" TEXT NOT NULL,
    "replenishmentRequestId" TEXT NOT NULL,
    "masterSkuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ReplenishmentRequestLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "WithdrawalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "reviewedByPlatformUserId" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryAllocationLedger" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "masterSkuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "wholesalePrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryAllocationLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCrmCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCrmCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCrmContact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCrmContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCrmLead" (
    "id" TEXT NOT NULL,
    "contactId" TEXT,
    "title" TEXT NOT NULL,
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCrmLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecruiterChangeLog_merchantProfileId_idx" ON "RecruiterChangeLog"("merchantProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantRecruitInviteCode_code_key" ON "MerchantRecruitInviteCode"("code");

-- CreateIndex
CREATE INDEX "MerchantRecruitInviteCode_distributorId_idx" ON "MerchantRecruitInviteCode"("distributorId");

-- CreateIndex
CREATE UNIQUE INDEX "MasterSku_skuCode_key" ON "MasterSku"("skuCode");

-- CreateIndex
CREATE INDEX "AllocationOrder_tenantId_status_idx" ON "AllocationOrder"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AllocationOrderLine_allocationOrderId_idx" ON "AllocationOrderLine"("allocationOrderId");

-- CreateIndex
CREATE INDEX "ReplenishmentRequest_tenantId_status_idx" ON "ReplenishmentRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ReplenishmentRequestLine_replenishmentRequestId_idx" ON "ReplenishmentRequestLine"("replenishmentRequestId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_distributorId_status_idx" ON "WithdrawalRequest"("distributorId", "status");

-- CreateIndex
CREATE INDEX "DeliveryAllocationLedger_orderId_idx" ON "DeliveryAllocationLedger"("orderId");

-- CreateIndex
CREATE INDEX "DeliveryAllocationLedger_tenantId_idx" ON "DeliveryAllocationLedger"("tenantId");

-- CreateIndex
CREATE INDEX "PlatformCrmLead_stage_idx" ON "PlatformCrmLead"("stage");

-- CreateIndex
CREATE INDEX "MerchantProfile_recruitedByDistributorId_idx" ON "MerchantProfile"("recruitedByDistributorId");

-- CreateIndex
CREATE INDEX "Order_tenantId_fulfillmentType_status_idx" ON "Order"("tenantId", "fulfillmentType", "status");

-- CreateIndex
CREATE INDEX "Order_fulfillmentType_status_idx" ON "Order"("fulfillmentType", "status");

-- CreateIndex
CREATE INDEX "ProductVariant_masterSkuId_idx" ON "ProductVariant"("masterSkuId");

-- AddForeignKey
ALTER TABLE "MerchantProfile" ADD CONSTRAINT "MerchantProfile_recruitedByDistributorId_fkey" FOREIGN KEY ("recruitedByDistributorId") REFERENCES "Distributor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterChangeLog" ADD CONSTRAINT "RecruiterChangeLog_merchantProfileId_fkey" FOREIGN KEY ("merchantProfileId") REFERENCES "MerchantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distributor" ADD CONSTRAINT "Distributor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantRecruitInviteCode" ADD CONSTRAINT "MerchantRecruitInviteCode_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_masterSkuId_fkey" FOREIGN KEY ("masterSkuId") REFERENCES "MasterSku"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationOrder" ADD CONSTRAINT "AllocationOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationOrderLine" ADD CONSTRAINT "AllocationOrderLine_allocationOrderId_fkey" FOREIGN KEY ("allocationOrderId") REFERENCES "AllocationOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationOrderLine" ADD CONSTRAINT "AllocationOrderLine_masterSkuId_fkey" FOREIGN KEY ("masterSkuId") REFERENCES "MasterSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplenishmentRequest" ADD CONSTRAINT "ReplenishmentRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplenishmentRequestLine" ADD CONSTRAINT "ReplenishmentRequestLine_replenishmentRequestId_fkey" FOREIGN KEY ("replenishmentRequestId") REFERENCES "ReplenishmentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplenishmentRequestLine" ADD CONSTRAINT "ReplenishmentRequestLine_masterSkuId_fkey" FOREIGN KEY ("masterSkuId") REFERENCES "MasterSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAllocationLedger" ADD CONSTRAINT "DeliveryAllocationLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAllocationLedger" ADD CONSTRAINT "DeliveryAllocationLedger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAllocationLedger" ADD CONSTRAINT "DeliveryAllocationLedger_masterSkuId_fkey" FOREIGN KEY ("masterSkuId") REFERENCES "MasterSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformCrmContact" ADD CONSTRAINT "PlatformCrmContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "PlatformCrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformCrmLead" ADD CONSTRAINT "PlatformCrmLead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "PlatformCrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
