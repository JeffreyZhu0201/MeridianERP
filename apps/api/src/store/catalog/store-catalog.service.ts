import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  StoreCatalogFiltersResponse,
  StoreCatalogQuery,
  StoreCatalogSort,
  UnifiedStoreCatalogResponse,
  UnifiedStoreProduct,
} from '@meridian/shared';
import { Prisma } from '@prisma/client';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FlagshipCatalogService } from '../../platform/flagship-catalog/flagship-catalog.service';
import { StoreTenantService } from '../common/store-tenant.service';
import {
  mapProductImages,
  primaryImageFromSummaries,
} from '../../platform/catalog/product-content.util';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: { select: { id: true; name: true; slug: true } };
    variants: true;
    images: { orderBy: { sortOrder: 'asc' } };
  };
}>;

@Injectable()
export class StoreCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
    private readonly flagshipCatalog: FlagshipCatalogService,
    private readonly inventoryService: InventoryService,
  ) {}

  private buildProductWhere(
    tenantId: string,
    query: StoreCatalogQuery,
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      tenantId,
      isPublished: true,
    };

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private minUnifiedPrice(product: UnifiedStoreProduct): number {
    const prices = product.variants.map((v) =>
      Number(v.branchPrice ?? v.flagshipPrice),
    );
    return prices.length ? Math.min(...prices) : 0;
  }

  private minStorePrice(product: ProductWithRelations): number {
    const prices = product.variants.map((v) => Number(v.price));
    return prices.length ? Math.min(...prices) : 0;
  }

  private sortUnifiedItems(
    items: UnifiedStoreProduct[],
    createdAtById: Map<string, Date>,
    sort: StoreCatalogSort = 'newest',
  ): UnifiedStoreProduct[] {
    const sorted = [...items];
    switch (sort) {
      case 'name_asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price_asc':
        sorted.sort(
          (a, b) => this.minUnifiedPrice(a) - this.minUnifiedPrice(b),
        );
        break;
      case 'price_desc':
        sorted.sort(
          (a, b) => this.minUnifiedPrice(b) - this.minUnifiedPrice(a),
        );
        break;
      case 'newest':
      default:
        sorted.sort(
          (a, b) =>
            (createdAtById.get(b.id)?.getTime() ?? 0) -
            (createdAtById.get(a.id)?.getTime() ?? 0),
        );
        break;
    }
    return sorted;
  }

  private sortStoreProducts(
    products: ProductWithRelations[],
    sort: StoreCatalogSort = 'newest',
  ): ProductWithRelations[] {
    const sorted = [...products];
    switch (sort) {
      case 'name_asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price_asc':
        sorted.sort((a, b) => this.minStorePrice(a) - this.minStorePrice(b));
        break;
      case 'price_desc':
        sorted.sort((a, b) => this.minStorePrice(b) - this.minStorePrice(a));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }
    return sorted;
  }

  private filterUnifiedInStock(
    items: UnifiedStoreProduct[],
  ): UnifiedStoreProduct[] {
    return items.filter((p) => p.variants.some((v) => v.inStock));
  }

  private filterStoreInStock(
    products: ProductWithRelations[],
  ): ProductWithRelations[] {
    return products.filter((p) =>
      p.variants.some((v) => v.isActive && v.inventory > 0),
    );
  }

  private mapProductMedia(product: {
    description: string | null;
    shortDescription?: string | null;
    images?: Array<{
      url: string;
      altText: string | null;
      sortOrder: number;
      isPrimary: boolean;
    }>;
  }) {
    const images = mapProductImages(product.images ?? []);
    return {
      description: product.description,
      shortDescription: product.shortDescription ?? null,
      images,
      primaryImageUrl: primaryImageFromSummaries(images),
    };
  }

  async getStoreCatalogFilters(
    slug: string,
  ): Promise<StoreCatalogFiltersResponse> {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    return this.getFilterMetaForTenant(tenant.id);
  }

  async getUnifiedCatalogFilters(
    fulfillmentSlug: string,
  ): Promise<StoreCatalogFiltersResponse> {
    if (!fulfillmentSlug) {
      throw new BadRequestException('fulfillment query parameter is required');
    }
    const flagshipTenantId =
      await this.flagshipCatalog.resolveFlagshipTenantId();
    return this.getFilterMetaForTenant(flagshipTenantId);
  }

  private async getFilterMetaForTenant(
    tenantId: string,
  ): Promise<StoreCatalogFiltersResponse> {
    const products = await this.prisma.product.findMany({
      where: { tenantId, isPublished: true, categoryId: { not: null } },
      select: {
        category: { select: { slug: true, name: true } },
      },
    });

    const counts = new Map<string, { name: string; count: number }>();
    for (const product of products) {
      if (!product.category) continue;
      const existing = counts.get(product.category.slug);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(product.category.slug, {
          name: product.category.name,
          count: 1,
        });
      }
    }

    return {
      categories: [...counts.entries()]
        .map(([slug, { name, count }]) => ({ slug, name, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  async listProducts(slug: string, query: StoreCatalogQuery = {}) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    let products = await this.prisma.product.findMany({
      where: this.buildProductWhere(tenant.id, query),
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (query.inStock) {
      products = this.filterStoreInStock(products);
    }

    return this.sortStoreProducts(products, query.sort);
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
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async listUnifiedCatalog(
    fulfillmentSlug: string,
    query: StoreCatalogQuery = {},
  ): Promise<UnifiedStoreCatalogResponse> {
    if (!fulfillmentSlug) {
      throw new BadRequestException('fulfillment query parameter is required');
    }
    const flagshipTenantId =
      await this.flagshipCatalog.resolveFlagshipTenantId();
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
      where: this.buildProductWhere(flagshipTenantId, query),
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { isActive: true, masterSkuId: { not: null } },
          orderBy: { createdAt: 'asc' },
        },
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const createdAtById = new Map(products.map((p) => [p.id, p.createdAt]));

    const masterSkuIds = [
      ...new Set(
        products.flatMap((p) =>
          p.variants
            .map((v) => v.masterSkuId)
            .filter((id): id is string => Boolean(id)),
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

    let items: UnifiedStoreProduct[] = [];
    for (const product of products) {
      const variants = await Promise.all(
        product.variants.map(async (flagshipVariant) => {
          const masterSkuId = flagshipVariant.masterSkuId!;
          const masterSku = masterSkuMap.get(masterSkuId);
          const branchVariant = branchByMaster.get(masterSkuId);
          let inventory = 0;
          if (branchVariant) {
            inventory = await this.inventoryService.getSellableQuantity(
              branchVariant.id,
            );
          }
          return {
            id: flagshipVariant.id,
            masterSkuId,
            sku: flagshipVariant.sku,
            name: flagshipVariant.name,
            flagshipPrice: Number(flagshipVariant.price),
            suggestedRetailPrice: Number(
              masterSku?.retailPrice ?? flagshipVariant.price,
            ),
            wholesalePrice: Number(masterSku?.wholesalePrice ?? 0),
            branchVariantId: branchVariant?.id ?? null,
            branchPrice:
              branchVariant?.price != null ? Number(branchVariant.price) : null,
            inventory,
            inStock: Boolean(branchVariant) && inventory > 0,
          };
        }),
      );

      if (variants.length === 0) continue;

      const media = this.mapProductMedia(product);
      items.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: media.description,
        shortDescription: media.shortDescription,
        category: product.category,
        variants,
        images: media.images,
        primaryImageUrl: media.primaryImageUrl,
      });
    }

    if (query.inStock) {
      items = this.filterUnifiedInStock(items);
    }

    items = this.sortUnifiedItems(items, createdAtById, query.sort);

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
