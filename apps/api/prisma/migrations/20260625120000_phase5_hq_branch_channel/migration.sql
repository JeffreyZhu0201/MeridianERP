-- Phase 5: HQ branch channel model
-- Generated for CI; applied via prisma db push in local dev

CREATE TYPE "FulfillmentType" AS ENUM ('PICKUP', 'DELIVERY');
CREATE TYPE "AllocationOrderStatus" AS ENUM ('DRAFT', 'ISSUED', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "ReplenishmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED');
CREATE TYPE "WithdrawalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Distributor" ALTER COLUMN "tenantId" DROP NOT NULL;

ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "recruitedByDistributorId" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "recruitedAt" TIMESTAMP(3);
ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "pendingRecruitInviteCode" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "storePublished" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'PICKUP';
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'CNY';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pickupCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pickupVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pickupVerifiedByUserId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryAddress" JSONB;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippedByPlatformUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_pickupCode_key" ON "Order"("pickupCode");

ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "masterSkuId" TEXT;

UPDATE "MerchantProfile" SET "storePublished" = true WHERE "onboardingStatus" = 'APPROVED';
