-- Sales promoter: link Distributor to PlatformAccount; commission sequence tracking

ALTER TABLE "Distributor" ADD COLUMN "accountId" TEXT;

CREATE UNIQUE INDEX "Distributor_accountId_key" ON "Distributor"("accountId");

CREATE INDEX "Distributor_accountId_idx" ON "Distributor"("accountId");

ALTER TABLE "Distributor" ADD CONSTRAINT "Distributor_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PlatformAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommissionLedger" ADD COLUMN "customerId" TEXT;
ALTER TABLE "CommissionLedger" ADD COLUMN "customerOrderSequence" INTEGER;
