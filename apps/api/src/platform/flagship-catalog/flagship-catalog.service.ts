import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slug.util';
import {
  mapProductImages,
  masterSkuImageInclude,
  primaryImageFromSummaries,
  syncProductContentFromMasterSku,
} from '../catalog/product-content.util';

@Injectable()
export class FlagshipCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveFlagshipTenantId(): Promise<string> {
    const profile = await this.prisma.merchantProfile.findFirst({
      where: { isFlagship: true, onboardingStatus: 'APPROVED' },
      include: { tenant: true },
    });
    if (!profile) {
      throw new BadRequestException('No approved flagship store configured');
    }
    return profile.tenantId;
  }

  async listCatalog() {
    const flagshipTenantId = await this.resolveFlagshipTenantId();
    const skus = await this.prisma.masterSku.findMany({
      orderBy: { skuCode: 'asc' },
      include: masterSkuImageInclude,
    });
    const flagshipVariants = await this.prisma.productVariant.findMany({
      where: {
        masterSkuId: { in: skus.map((s) => s.id) },
        product: { tenantId: flagshipTenantId },
      },
      include: {
        product: {
          select: {
            id: true,
            isPublished: true,
            images: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
    const variantByMaster = new Map(
      flagshipVariants.map((v) => [v.masterSkuId!, v]),
    );

    return skus.map((sku) => {
      const variant = variantByMaster.get(sku.id);
      const productImages = variant?.product.images ?? [];
      const imageSummaries = mapProductImages(productImages);
      return {
        id: sku.id,
        skuCode: sku.skuCode,
        name: sku.name,
        description: sku.description,
        shortDescription: sku.shortDescription,
        quantityOnHand: sku.quantityOnHand,
        cumulativeShippedQty: sku.cumulativeShippedQty,
        unitCost: sku.unitCost.toString(),
        wholesalePrice: sku.wholesalePrice.toString(),
        retailPrice: sku.retailPrice.toString(),
        flagshipPrice: sku.flagshipPrice.toString(),
        isActive: sku.isActive,
        synced: Boolean(variant),
        flagshipProductId: variant?.product.id ?? null,
        images: imageSummaries,
        primaryImageUrl: primaryImageFromSummaries(imageSummaries),
      };
    });
  }

  async syncAllActive() {
    const skus = await this.prisma.masterSku.findMany({
      where: { isActive: true },
    });
    for (const sku of skus) {
      await this.syncMasterSkuToFlagship(sku.id);
    }
    return { synced: skus.length };
  }

  async syncMasterSkuToFlagship(masterSkuId: string) {
    const sku = await this.prisma.masterSku.findUnique({
      where: { id: masterSkuId },
      include: masterSkuImageInclude,
    });
    if (!sku) throw new NotFoundException('Master SKU not found');

    const tenantId = await this.resolveFlagshipTenantId();
    const productSlug = slugify(sku.skuCode) || `sku-${sku.id.slice(-6)}`;

    let variant = await this.prisma.productVariant.findFirst({
      where: { masterSkuId: sku.id, product: { tenantId } },
      include: { product: true },
    });

    if (variant) {
      await this.prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: variant!.productId },
          data: {
            name: sku.name,
            description: sku.description,
            shortDescription: sku.shortDescription,
            isPublished: sku.isActive,
          },
        });
        await tx.productVariant.update({
          where: { id: variant!.id },
          data: {
            name: sku.name,
            sku: sku.skuCode,
            price: sku.flagshipPrice,
            isActive: sku.isActive,
          },
        });
        await syncProductContentFromMasterSku(tx, variant!.productId, sku);
      });
      return variant.product;
    }

    const existingProduct = await this.prisma.product.findFirst({
      where: { tenantId, slug: productSlug },
    });
    const product =
      existingProduct ??
      (await this.prisma.product.create({
        data: {
          tenantId,
          name: sku.name,
          slug: productSlug,
          description: sku.description,
          shortDescription: sku.shortDescription,
          isPublished: sku.isActive,
        },
      }));

    if (existingProduct) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          name: sku.name,
          description: sku.description,
          shortDescription: sku.shortDescription,
          isPublished: sku.isActive,
        },
      });
    }

    variant = await this.prisma.productVariant.create({
      data: {
        productId: product.id,
        masterSkuId: sku.id,
        sku: sku.skuCode,
        name: sku.name,
        price: sku.flagshipPrice,
        isActive: sku.isActive,
      },
      include: { product: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await syncProductContentFromMasterSku(tx, product.id, sku);
    });

    return variant.product;
  }
}
