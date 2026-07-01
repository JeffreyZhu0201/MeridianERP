/**
 * StoreCatalogController - 商品目录控制器
 *
 * 处理商店前端的商品浏览请求。
 * 所有路由公开，无需登录即可浏览商品。
 *
 * 路由结构：
 * - GET /store/:slug/products - 获取商品列表
 * - GET /store/:slug/products/:productSlug - 获取商品详情
 *
 * @controller StoreCatalogController
 */

import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { StoreCatalogService } from './store-catalog.service';

/**
 * 商品目录控制器
 * 提供商品浏览的 HTTP 端点
 */
@Controller('store/:slug/products')
export class StoreCatalogController {
  /**
   * 构造函数 - 注入商品目录服务
   * @param catalogService - 商品目录服务
   */
  constructor(private readonly catalogService: StoreCatalogService) {}

  /**
   * 获取商品列表接口
   *
   * 功能：获取指定商店的所有已发布商品
   * 公开接口：无需认证即可访问
   *
   * @route GET /store/:slug/products
   * @param slug - 商户商店的 URL 标识
   * @returns 商品列表，每个商品包含分类和规格信息
   */
  @Public()
  @Get()
  listProducts(@Param('slug') slug: string) {
    return this.catalogService.listProducts(slug);
  }

  /**
   * 获取商品详情接口
   *
   * 功能：获取指定商品的详细信息
   * 公开接口：无需认证即可访问
   *
   * @route GET /store/:slug/products/:productSlug
   * @param slug - 商户商店的 URL 标识
   * @param productSlug - 商品的 URL 标识（slug）
   * @returns 商品详情，包含分类和规格
   * @throws NotFoundException - 商品不存在或未发布
   */
  @Public()
  @Get(':productSlug')
  getProduct(
    @Param('slug') slug: string,
    @Param('productSlug') productSlug: string,
  ) {
    return this.catalogService.getProduct(slug, productSlug);
  }
}
