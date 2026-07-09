-- CreateEnum
CREATE TYPE "AiFeature" AS ENUM ('PLATFORM_DIAGNOSIS', 'PLATFORM_WITHDRAWAL_INSIGHT', 'PLATFORM_DELIVERY_INSIGHT', 'PLATFORM_FUNDS_INSIGHT', 'MERCHANT_REPLENISHMENT', 'MERCHANT_PRODUCT_COPY', 'MERCHANT_CRM_FOLLOW_UP');

-- CreateEnum
CREATE TYPE "AiCallMode" AS ENUM ('LIVE', 'MOCK', 'LIVE_FALLBACK_MOCK');

-- CreateEnum
CREATE TYPE "AiCallStatus" AS ENUM ('SUCCESS', 'ERROR', 'PARSE_FALLBACK');

-- CreateEnum
CREATE TYPE "AiActorType" AS ENUM ('PLATFORM', 'MERCHANT');

-- CreateTable
CREATE TABLE "AiCallLog" (
    "id" TEXT NOT NULL,
    "feature" "AiFeature" NOT NULL,
    "mode" "AiCallMode" NOT NULL,
    "status" "AiCallStatus" NOT NULL,
    "tenantId" TEXT,
    "actorUserId" TEXT,
    "actorType" "AiActorType",
    "model" TEXT,
    "latencyMs" INTEGER,
    "errorMessage" TEXT,
    "inputSummary" TEXT,
    "outputSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAnalysisRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "feature" "AiFeature" NOT NULL,
    "triggeredByUserId" TEXT,
    "result" JSONB NOT NULL,
    "callLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAnalysisRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiCallLog_feature_createdAt_idx" ON "AiCallLog"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "AiCallLog_tenantId_createdAt_idx" ON "AiCallLog"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiAnalysisRecord_callLogId_key" ON "AiAnalysisRecord"("callLogId");

-- CreateIndex
CREATE INDEX "AiAnalysisRecord_tenantId_feature_createdAt_idx" ON "AiAnalysisRecord"("tenantId", "feature", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AiCallLog" ADD CONSTRAINT "AiCallLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnalysisRecord" ADD CONSTRAINT "AiAnalysisRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnalysisRecord" ADD CONSTRAINT "AiAnalysisRecord_callLogId_fkey" FOREIGN KEY ("callLogId") REFERENCES "AiCallLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
