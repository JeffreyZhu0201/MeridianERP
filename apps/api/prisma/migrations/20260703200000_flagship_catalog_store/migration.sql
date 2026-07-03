-- AlterTable
ALTER TABLE "MasterSku" ADD COLUMN "flagshipPrice" DECIMAL(12,2);

UPDATE "MasterSku" SET "flagshipPrice" = "retailPrice" WHERE "flagshipPrice" IS NULL;

ALTER TABLE "MasterSku" ALTER COLUMN "flagshipPrice" SET NOT NULL;

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN "maxRetailPriceDeviationPercent" INTEGER NOT NULL DEFAULT 10;
