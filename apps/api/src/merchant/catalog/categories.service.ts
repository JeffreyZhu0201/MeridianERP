import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { slugify } from '../../common/utils/slug.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCategoryDto,
  CreateProductDto,
  UpdateCategoryDto,
  UpdateProductDto,
} from './dto/catalog.dto';

/**
 * 商户分类服务 (MerchantCategoriesService)
 *
 * 负责商户商品分类（Category）的 CRUD 操作。
 *
 * 功能：
 * 1. 分类列表/详情查询（支持层级结构）
 * 2. 创建分类（支持父子分类）
 * 3. 更新分类名称和父分类
 * 4. 删除分类
 *
 * 业务逻辑：
 * - 分类名称转换为 slug，要求在租户内唯一
 * - 支持树形结构（parentId 关联）
 * - 更新分类时会级联更新 slug
 */
@Injectable()
export class MerchantCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(tenantId: string, dto: CreateCategoryDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.category.findFirst({
      where: { tenantId, slug },
    });
    if (existing) {
      throw new ConflictException('Category slug already exists');
    }
    if (dto.parentId) {
      await this.findOne(tenantId, dto.parentId);
    }
    return this.prisma.category.create({
      data: {
        tenantId,
        name: dto.name,
        slug,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(tenantId, id);
    const data: Prisma.CategoryUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = slugify(dto.name);
    }
    if (dto.parentId !== undefined) {
      if (dto.parentId) {
        await this.findOne(tenantId, dto.parentId);
      }
      data.parent = dto.parentId
        ? { connect: { id: dto.parentId } }
        : { disconnect: true };
    }
    if (data.slug && data.slug !== category.slug) {
      const conflict = await this.prisma.category.findFirst({
        where: { tenantId, slug: data.slug as string, id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException('Category slug already exists');
      }
    }
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }
}
