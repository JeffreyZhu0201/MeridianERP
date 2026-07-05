-- DropForeignKey: CrmLead.distributor
ALTER TABLE "CrmLead" DROP CONSTRAINT IF EXISTS "CrmLead_distributorId_fkey";

-- AlterTable: remove branch distributor attribution from CRM leads
ALTER TABLE "CrmLead" DROP COLUMN IF EXISTS "distributorId";
