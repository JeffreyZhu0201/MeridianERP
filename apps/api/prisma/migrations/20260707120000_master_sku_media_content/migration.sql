-- Master SKU content + media assets
ALTER TABLE "MasterSku" ADD COLUMN "description" TEXT;
ALTER TABLE "MasterSku" ADD COLUMN "shortDescription" TEXT;

ALTER TABLE "Product" ADD COLUMN "shortDescription" TEXT;

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "uploadedByPlatformUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MasterSkuImage" (
    "id" TEXT NOT NULL,
    "masterSkuId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "altText" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterSkuImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sourceMediaAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE INDEX "MediaAsset_uploadedByPlatformUserId_idx" ON "MediaAsset"("uploadedByPlatformUserId");

CREATE UNIQUE INDEX "MasterSkuImage_masterSkuId_mediaAssetId_key" ON "MasterSkuImage"("masterSkuId", "mediaAssetId");
CREATE INDEX "MasterSkuImage_masterSkuId_sortOrder_idx" ON "MasterSkuImage"("masterSkuId", "sortOrder");

CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedByPlatformUserId_fkey" FOREIGN KEY ("uploadedByPlatformUserId") REFERENCES "PlatformUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MasterSkuImage" ADD CONSTRAINT "MasterSkuImage_masterSkuId_fkey" FOREIGN KEY ("masterSkuId") REFERENCES "MasterSku"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MasterSkuImage" ADD CONSTRAINT "MasterSkuImage_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
