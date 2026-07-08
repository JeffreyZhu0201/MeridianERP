import type {
  MasterSkuImageInput,
  MasterSkuImageSummary,
  ProductImageSummary,
} from '@meridian/shared';
import { Prisma } from '@prisma/client';

export const masterSkuImageInclude = {
  images: {
    include: { mediaAsset: true },
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.MasterSkuInclude;

export type MasterSkuWithImages = Prisma.MasterSkuGetPayload<{
  include: typeof masterSkuImageInclude;
}>;

export function mapMasterSkuImages(
  sku: MasterSkuWithImages,
): MasterSkuImageSummary[] {
  return sku.images.map((image) => ({
    id: image.id,
    mediaAssetId: image.mediaAssetId,
    url: image.mediaAsset.url,
    altText: image.altText,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
  }));
}

export function primaryImageFromSummaries(
  images: Array<{ url: string; isPrimary: boolean }>,
): string | null {
  if (images.length === 0) return null;
  const primary = images.find((image) => image.isPrimary);
  return primary?.url ?? images[0]?.url ?? null;
}

export function mapProductImages(
  images: Array<{
    url: string;
    altText: string | null;
    sortOrder: number;
    isPrimary: boolean;
  }>,
): ProductImageSummary[] {
  return images.map((image) => ({
    url: image.url,
    altText: image.altText,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
  }));
}

export async function replaceMasterSkuImages(
  tx: Prisma.TransactionClient,
  masterSkuId: string,
  images: MasterSkuImageInput[] | undefined,
): Promise<string[]> {
  if (images === undefined) return [];

  const existing = await tx.masterSkuImage.findMany({
    where: { masterSkuId },
    select: { mediaAssetId: true },
  });
  const previousIds = existing.map((image) => image.mediaAssetId);

  await tx.masterSkuImage.deleteMany({ where: { masterSkuId } });

  if (images.length === 0) {
    return previousIds;
  }

  let hasPrimary = images.some((image) => image.isPrimary);
  const newIds = new Set(images.map((image) => image.mediaAssetId));
  await tx.masterSkuImage.createMany({
    data: images.map((image, index) => ({
      masterSkuId,
      mediaAssetId: image.mediaAssetId,
      sortOrder: image.sortOrder ?? index,
      altText: image.altText ?? null,
      isPrimary: image.isPrimary ?? (!hasPrimary && index === 0),
    })),
  });

  return previousIds.filter((id) => !newIds.has(id));
}

export async function syncProductContentFromMasterSku(
  tx: Prisma.TransactionClient,
  productId: string,
  masterSku: {
    id: string;
    description: string | null;
    shortDescription: string | null;
  },
) {
  await tx.product.update({
    where: { id: productId },
    data: {
      description: masterSku.description,
      shortDescription: masterSku.shortDescription,
    },
  });

  const images = await tx.masterSkuImage.findMany({
    where: { masterSkuId: masterSku.id },
    include: { mediaAsset: true },
    orderBy: { sortOrder: 'asc' },
  });

  await tx.productImage.deleteMany({ where: { productId } });
  if (images.length === 0) return;

  await tx.productImage.createMany({
    data: images.map((image, index) => ({
      productId,
      url: image.mediaAsset.url,
      altText: image.altText,
      sortOrder: image.sortOrder ?? index,
      isPrimary: image.isPrimary,
      sourceMediaAssetId: image.mediaAssetId,
    })),
  });
}
