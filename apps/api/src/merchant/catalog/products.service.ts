import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { slugify } from '../../common/utils/slug.util';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantCategoriesService } from './categories.service';
import { CreateProductDto, UpdateProductDto } from './dto/catalog.dto';

@Injectable()
export class MerchantProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: MerchantCategoriesService,
    private readonly inventoryService: InventoryService,
  ) {}

  findAll(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId },
      include: {
        category: true,
        variants: {
          orderBy: { createdAt: 'asc' },
          include: { masterSku: { select: { retailPrice: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        variants: {
          orderBy: { createdAt: 'asc' },
          include: { masterSku: { select: { retailPrice: true } } },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(tenantId: string, dto: CreateProductDto) {
    const profile = await this.prisma.merchantProfile.findFirst({
      where: { tenantId },
    });
    if (profile && !profile.isFlagship) {
      throw new BadRequestException(
        'Branch stores cannot create products manually; stock arrives via allocation',
      );
    }
    const slug = slugify(dto.name);
    const existing = await this.prisma.product.findFirst({
      where: { tenantId, slug },
    });
    if (existing) {
      throw new ConflictException('Product slug already exists');
    }
    if (dto.categoryId) {
      await this.categoriesService.findOne(tenantId, dto.categoryId);
    }
    const product = await this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        slug,
        description: dto.description ?? null,
        categoryId: dto.categoryId ?? null,
        isPublished: dto.isPublished ?? false,
        variants: {
          create: dto.variants.map((v) => ({
            sku: v.sku,
            name: v.name,
            price: v.price,
            inventory: v.inventory ?? 0,
            isActive: v.isActive ?? true,
          })),
        },
      },
      include: { category: true, variants: true },
    });

    await this.inventoryService.migrateTenantInventory(tenantId);
    for (const variant of product.variants) {
      await this.inventoryService.seedVariantStockLevel(
        tenantId,
        variant.id,
        variant.inventory,
      );
    }

    return product;
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(tenantId, id);
    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = slugify(dto.name);
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.isPublished !== undefined) {
      data.isPublished = dto.isPublished;
    }
    if (dto.categoryId !== undefined) {
      if (dto.categoryId) {
        await this.categoriesService.findOne(tenantId, dto.categoryId);
        data.category = { connect: { id: dto.categoryId } };
      } else {
        data.category = { disconnect: true };
      }
    }
    if (data.slug) {
      const conflict = await this.prisma.product.findFirst({
        where: { tenantId, slug: data.slug as string, id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException('Product slug already exists');
      }
    }

    if (dto.variants) {
      const existing = await this.findOne(tenantId, id);
      const profile = await this.prisma.merchantProfile.findFirst({
        where: { tenantId },
      });
      const isBranch = profile && !profile.isFlagship;
      const linkedVariants = existing.variants.filter((v) => v.masterSkuId);

      if (isBranch && linkedVariants.length > 0) {
        for (const existingVariant of linkedVariants) {
          const incoming = dto.variants.find(
            (v) => v.sku === existingVariant.sku,
          );
          if (!incoming) continue;
          await this.assertBranchPriceAllowed(
            existingVariant.masterSkuId!,
            incoming.price,
          );
          await this.prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: { price: incoming.price },
          });
        }
      } else {
        await this.prisma.productVariant.deleteMany({
          where: { productId: id },
        });
        await this.prisma.productVariant.createMany({
          data: dto.variants.map((v) => ({
            productId: id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            inventory: 0,
            isActive: v.isActive ?? true,
          })),
        });
      }
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true, variants: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertBranchPriceAllowed(masterSkuId: string, price: number) {
    const masterSku = await this.prisma.masterSku.findUnique({
      where: { id: masterSkuId },
    });
    if (!masterSku) {
      throw new NotFoundException('Master SKU not found');
    }
    const settings = await this.prisma.platformSettings.findFirst();
    const maxPct = settings?.maxRetailPriceDeviationPercent ?? 10;
    const suggested = Number(masterSku.retailPrice);
    if (suggested <= 0) {
      throw new BadRequestException('Suggested retail price is not configured');
    }
    const deviation = Math.abs(price - suggested) / suggested;
    if (deviation > maxPct / 100) {
      throw new BadRequestException(
        `Price must be within ±${maxPct}% of suggested retail price (${suggested})`,
      );
    }
  }
}
