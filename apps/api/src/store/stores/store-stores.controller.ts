/**
 * StoreStoresController - 商店列表控制器
 *
 * 处理商店发现请求，提供已审批商户商店的列表。
 * 该接口用于帮助消费者找到并选择要购物的商店。
 *
 * 路由结构：
 * - GET /store/stores - 获取已发布的商店列表
 *
 * @controller StoreStoresController
 */

import { Controller, Get } from '@nestjs/common';
import { StoreStoresService } from './store-stores.service';

/**
 * 商店列表控制器
 * 提供商店发现功能的 HTTP 端点
 */
@Controller('store/stores')
export class StoreStoresController {
  /**
   * 构造函数 - 注入商店列表服务
   * @param storeStoresService - 商店列表服务
   */
  constructor(private readonly storeStoresService: StoreStoresService) {}

  /**
   * 获取已发布商店列表接口
   *
   * 功能：返回所有已审批通过的商户商店
   * 用于商店发现页面，让消费者可以浏览和选择商店
   *
   * @route GET /store/stores
   * @returns 商店列表，每个商店包含 slug 和 displayName
   */
  @Get()
  listPublished() {
    return this.storeStoresService.listPublished();
  }
}
