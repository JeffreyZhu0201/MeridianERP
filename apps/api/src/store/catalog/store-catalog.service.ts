/**
 * StoreCatalogService - 商品目录服务
 *
 * 负责商店前端的商品浏览功能，包括：
 * - 获取商品列表（已发布的商品）
 * - 获取单个商品详情
 *
 * 数据筛选规则：
 * - 仅返回 isPublished = true 的商品
 * - 仅返回 isActive = true 的商品规格
 * - 按创建时间倒序排列（ newest first）
 *
 * @service StoreCatalogService
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreTenantService } from '../common/store-tenant.service';

/**
 * 可注入的商品目录服务
 * 提供商品浏览功能
 */
@Injectable()
export class StoreCatalogService {
  /**
   * 构造函数 - 注入所需依赖
   * @param prisma - Prisma 数据库服务
   * @param storeTenant - 商店租户解析服务
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
  ) {}

  /**
   * 获取商品列表
   *
   * 功能：获取指定商店的所有已发布商品
   *
   * 查询规则：
   * - 仅返回 isPublished = true 的商品
   * - 仅包含活跃的规格（isActive = true）
   * - 按创建时间倒序排列
   *
   * @param slug - 商户商店的 URL 标识
   * @returns 商品列表，包含每个商品的分类信息和规格变体
   *
   * @example 返回数据结构
   * [{
   *   id: "prod_xxx",
   *   name: "商品名称",
   *   slug: "product-slug",
   *   price: 99.00,
   *   category: { id, name, slug },
   *   variants: [{ id, name, price, isActive, ... }]
   * }]
   */
  async listProducts(slug: string) {
    // 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 查询已发布的商品及其规格
    return this.prisma.product.findMany({
      where: { tenantId: tenant.id, isPublished: true },
      include: {
        // 只选择分类的 id、name、slug 字段
        category: { select: { id: true, name: true, slug: true } },
        // 只包含活跃的规格，并按创建时间升序排列
        variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      },
      // 按创建时间倒序，最新商品在前
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取商品详情
   *
   * 功能：获取指定 slug 的单个商品详情
   *
   * 查询规则：
   * - 通过 tenantId + slug 唯一确定商品
   * - 仅返回 isPublished = true 的商品
   * - 仅包含活跃的规格
   *
   * @param slug - 商户商店的 URL 标识
   * @param productSlug - 商品的 URL 标识（slug）
   * @returns 商品详情对象，包含分类和规格信息
   * @throws NotFoundException - 商品不存在或未发布
   */
  async getProduct(slug: string, productSlug: string) {
    // 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 查询指定商品
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

    // 商品不存在时抛出 404
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
