import {
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

/**
 * 商户商品服务 (MerchantProductsService)
 *
 * 负责商户商品（Product）和商品变体（ProductVariant）的 CRUD 操作。
 *
 * 功能：
 * 1. 商品列表/详情查询
 * 2. 创建商品（自动生成 slug，自动初始化库存）
 * 3. 更新商品（支持更新变体列表）
 * 4. 删除商品
 *
 * 业务逻辑：
 * - 商品名称会转换为 slug，要求在租户内唯一
 * - 创建商品时会自动初始化各仓库的库存记录
 * - 更新变体时会先删除旧变体再创建新变体
 */
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
      include: { category: true, variants: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: true, variants: { orderBy: { createdAt: 'asc' } } },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(tenantId: string, dto: CreateProductDto) {
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
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
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
}
