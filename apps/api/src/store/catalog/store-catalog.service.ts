import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UnifiedStoreCatalogResponse, UnifiedStoreProduct } from '@meridian/shared';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FlagshipCatalogService } from '../../platform/flagship-catalog/flagship-catalog.service';
import { StoreTenantService } from '../common/store-tenant.service';

@Injectable()
export class StoreCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
    private readonly flagshipCatalog: FlagshipCatalogService,
    private readonly inventoryService: InventoryService,
  ) {}

  async listProducts(slug: string) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    return this.prisma.product.findMany({
      where: { tenantId: tenant.id, isPublished: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProduct(slug: string, productSlug: string) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const product = await this.prisma.product.findFirst({
      where: {
        tenantId: tenant.id,
        slug: productSlug,
        isPublished: true,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async listUnifiedCatalog(fulfillmentSlug: string): Promise<UnifiedStoreCatalogResponse> {
    if (!fulfillmentSlug) {
      throw new BadRequestException('fulfillment query parameter is required');
    }
    const flagshipTenantId = await this.flagshipCatalog.resolveFlagshipTenantId();
    const { tenant: fulfillmentTenant } =
      await this.storeTenant.resolveApprovedTenant(fulfillmentSlug);

    const flagshipProfile = await this.prisma.merchantProfile.findFirst({
      where: { isFlagship: true, onboardingStatus: 'APPROVED' },
      include: { tenant: true },
    });
    if (!flagshipProfile) {
      throw new BadRequestException('No approved flagship store configured');
    }

    const products = await this.prisma.product.findMany({
      where: { tenantId: flagshipTenantId, isPublished: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { isActive: true, masterSkuId: { not: null } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const masterSkuIds = [
      ...new Set(
        products.flatMap((p) =>
          p.variants.map((v) => v.masterSkuId).filter((id): id is string => Boolean(id)),
        ),
      ),
    ];

    const [masterSkus, branchVariants] = await Promise.all([
      this.prisma.masterSku.findMany({ where: { id: { in: masterSkuIds } } }),
      this.prisma.productVariant.findMany({
        where: {
          masterSkuId: { in: masterSkuIds },
          isActive: true,
          product: { tenantId: fulfillmentTenant.id },
        },
      }),
    ]);

    const masterSkuMap = new Map(masterSkus.map((s) => [s.id, s]));
    const branchByMaster = new Map(
      branchVariants.map((v) => [v.masterSkuId!, v]),
    );

    const items: UnifiedStoreProduct[] = [];
    for (const product of products) {
      const variants = await Promise.all(
        product.variants.map(async (flagshipVariant) => {
          const masterSkuId = flagshipVariant.masterSkuId!;
          const masterSku = masterSkuMap.get(masterSkuId);
          const branchVariant = branchByMaster.get(masterSkuId);
          let inventory = 0;
          if (branchVariant) {
            inventory = await this.inventoryService.getSellableQuantity(branchVariant.id);
          }
          return {
            id: flagshipVariant.id,
            masterSkuId,
            sku: flagshipVariant.sku,
            name: flagshipVariant.name,
            flagshipPrice: flagshipVariant.price,
            suggestedRetailPrice: masterSku?.retailPrice ?? flagshipVariant.price,
            wholesalePrice: masterSku?.wholesalePrice ?? 0,
            branchVariantId: branchVariant?.id ?? null,
            branchPrice: branchVariant?.price ?? null,
            inventory,
            inStock: Boolean(branchVariant) && inventory > 0,
          };
        }),
      );

      if (variants.length === 0) continue;

      items.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        variants,
      });
    }

    return {
      fulfillmentSlug,
      flagshipSlug: flagshipProfile.tenant.slug,
      items,
    };
  }

  async getUnifiedProduct(
    fulfillmentSlug: string,
    productSlug: string,
  ): Promise<UnifiedStoreProduct> {
    const catalog = await this.listUnifiedCatalog(fulfillmentSlug);
    const product = catalog.items.find((p) => p.slug === productSlug);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
