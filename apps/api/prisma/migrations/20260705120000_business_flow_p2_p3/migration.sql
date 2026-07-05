-- Merchant operational freeze
ALTER TABLE "MerchantProfile" ADD COLUMN "operationalFrozen" BOOLEAN NOT NULL DEFAULT false;

-- Delivery confirmation
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- Flat delivery fee per tenant
ALTER TABLE "TenantSettings" ADD COLUMN "deliveryFlatFee" DECIMAL(12,2) NOT NULL DEFAULT 0;
