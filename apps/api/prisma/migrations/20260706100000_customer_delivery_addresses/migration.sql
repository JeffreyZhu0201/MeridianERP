-- CreateTable
CREATE TABLE "CustomerDeliveryAddress" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "label" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "postalCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerDeliveryAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerDeliveryAddress_accountId_idx" ON "CustomerDeliveryAddress"("accountId");

-- AddForeignKey
ALTER TABLE "CustomerDeliveryAddress" ADD CONSTRAINT "CustomerDeliveryAddress_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
