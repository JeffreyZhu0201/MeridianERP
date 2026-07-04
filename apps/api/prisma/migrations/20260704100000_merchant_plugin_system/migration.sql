-- CreateEnum
CREATE TYPE "PluginCatalogStatus" AS ENUM ('ACTIVE', 'COMING_SOON', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "TenantPluginStatus" AS ENUM ('INSTALLED', 'UNINSTALLED');

-- CreateTable
CREATE TABLE "PluginDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "nameKey" TEXT NOT NULL,
    "descriptionKey" TEXT NOT NULL,
    "navRoutes" JSONB,
    "status" "PluginCatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDefaultOnSignup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PluginDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantPlugin" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "status" "TenantPluginStatus" NOT NULL DEFAULT 'INSTALLED',
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),
    "installedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantPlugin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PluginDefinition_code_key" ON "PluginDefinition"("code");

-- CreateIndex
CREATE INDEX "TenantPlugin_tenantId_idx" ON "TenantPlugin"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantPlugin_tenantId_pluginId_key" ON "TenantPlugin"("tenantId", "pluginId");

-- AddForeignKey
ALTER TABLE "TenantPlugin" ADD CONSTRAINT "TenantPlugin_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPlugin" ADD CONSTRAINT "TenantPlugin_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "PluginDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
