/**
 * StoreOrdersController - 商店订单控制器
 *
 * 处理商店消费者的订单相关请求，包括：
 * - GET /store/:slug/orders - 获取订单列表
 * - GET /store/:slug/orders/:id - 获取订单详情
 * - GET /store/:slug/orders/:id/pickup-token - 获取自提二维码
 *
 * 认证要求：
 * - 所有路由需要已登录的消费者（StoreAuthGuard）
 *
 * @controller StoreOrdersController
 */

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { StoreAuthGuard } from '../../auth/guards/store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { StoreOrdersService } from './store-orders.service';

/**
 * 商店订单控制器
 * 提供消费者订单查询的 HTTP 端点
 */
@Controller('store/:slug/orders')
@UseGuards(StoreAuthGuard)  // 需要已登录的消费者
export class StoreOrdersController {
  /**
   * 构造函数 - 注入订单服务
   * @param ordersService - 订单服务
   */
  constructor(private readonly ordersService: StoreOrdersService) {}

  /**
   * 获取订单列表接口
   *
   * @route GET /store/:slug/orders
   * @param slug - 商户商店的 URL 标识
   * @param user - 当前登录用户（由 StoreAuthGuard 提供）
   * @returns 订单列表（简化信息）
   */
  @Get()
  list(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listForCustomer(slug, user.userId);
  }

  /**
   * 获取自提二维码接口
   *
   * 功能：获取订单的自提二维码，用于商家扫描验证
   *
   * @route GET /store/:slug/orders/:id/pickup-token
   * @param slug - 商户商店的 URL 标识
   * @param id - 订单 ID
   * @param user - 当前登录用户（由 StoreAuthGuard 提供）
   * @returns 包含 pickupCode 和二维码 payload
   * @throws BadRequestException - 订单不是自提类型或已验证
   */
  @Get(':id/pickup-token')
  getPickupToken(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.getPickupToken(slug, user.userId, id);
  }

  /**
   * 获取订单详情接口
   *
   * @route GET /store/:slug/orders/:id
   * @param slug - 商户商店的 URL 标识
   * @param id - 订单 ID
   * @param user - 当前登录用户（由 StoreAuthGuard 提供）
   * @returns 订单详情（包含商品明细）
   * @throws NotFoundException - 订单不存在
   */
  @Get(':id')
  getOne(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.getForCustomer(slug, user.userId, id);
  }
}
