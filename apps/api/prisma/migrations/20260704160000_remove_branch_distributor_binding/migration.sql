-- AlterEnum: 移除 CommissionSource.RETAIL，仅保留 ALLOCATION
BEGIN;
CREATE TYPE "CommissionSource_new" AS ENUM ('ALLOCATION');
ALTER TABLE "public"."CommissionLedger" ALTER COLUMN "commissionSource" DROP DEFAULT;
ALTER TABLE "public"."CommissionLedger" ALTER COLUMN "commissionSource" TYPE "CommissionSource_new" USING (CASE WHEN "commissionSource"::text = 'RETAIL' THEN 'ALLOCATION'::"CommissionSource_new" ELSE "commissionSource"::text::"CommissionSource_new" END);
ALTER TYPE "CommissionSource" RENAME TO "CommissionSource_old";
ALTER TYPE "CommissionSource_new" RENAME TO "CommissionSource";
DROP TYPE "public"."CommissionSource_old";
ALTER TABLE "public"."CommissionLedger" ALTER COLUMN "commissionSource" SET DEFAULT 'ALLOCATION';
COMMIT;

-- DropForeignKey: Binding
ALTER TABLE "Binding" DROP CONSTRAINT "Binding_distributorId_fkey";
ALTER TABLE "Binding" DROP CONSTRAINT "Binding_tenantId_fkey";

-- DropForeignKey: Cart.distributor
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_distributorId_fkey";

-- DropForeignKey: DistributorQrCode.distributor
ALTER TABLE "DistributorQrCode" DROP CONSTRAINT "DistributorQrCode_distributorId_fkey";

-- DropForeignKey: Order.distributor
ALTER TABLE "Order" DROP CONSTRAINT "Order_distributorId_fkey";

-- DropIndex: Order 上的 distributorId 索引
DROP INDEX IF EXISTS "Order_distributorId_idx";
DROP INDEX IF EXISTS "Order_tenantId_distributorId_status_createdAt_idx";

-- AlterTable: 删除 Cart.distributorId
ALTER TABLE "Cart" DROP COLUMN "distributorId";

-- AlterTable: 删除 Order.distributorId
ALTER TABLE "Order" DROP COLUMN "distributorId";

-- AlterTable: 删除 TenantSettings.notifyOnBinding
ALTER TABLE "TenantSettings" DROP COLUMN "notifyOnBinding";

-- DropTable: Binding
DROP TABLE IF EXISTS "Binding";

-- DropTable: DistributorQrCode
DROP TABLE IF EXISTS "DistributorQrCode";

-- DropEnum: BindType
DROP TYPE IF EXISTS "BindType";
