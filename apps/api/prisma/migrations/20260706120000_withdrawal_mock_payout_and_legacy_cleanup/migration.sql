-- Mock payout fields on withdrawal requests
ALTER TABLE "WithdrawalRequest" ADD COLUMN "payoutProvider" TEXT;
ALTER TABLE "WithdrawalRequest" ADD COLUMN "payoutReference" TEXT;
ALTER TABLE "WithdrawalRequest" ADD COLUMN "disbursedAt" TIMESTAMP(3);
ALTER TABLE "WithdrawalRequest" ADD COLUMN "payoutError" TEXT;

-- Drop legacy replenishment + platform CRM tables
DROP TABLE IF EXISTS "ReplenishmentRequestLine";
DROP TABLE IF EXISTS "ReplenishmentRequest";
DROP TABLE IF EXISTS "PlatformCrmLead";
DROP TABLE IF EXISTS "PlatformCrmContact";
DROP TABLE IF EXISTS "PlatformCrmCompany";
DROP TYPE IF EXISTS "ReplenishmentRequestStatus";
