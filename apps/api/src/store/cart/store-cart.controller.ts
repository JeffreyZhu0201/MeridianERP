/**
 * StoreCartController - 购物车控制器
 *
 * 处理商店前端的购物车相关请求，包括：
 * - GET /store/:slug/cart - 获取购物车
 * - POST /store/:slug/cart/items - 添加商品到购物车
 * - PATCH /store/:slug/cart/items/:itemId - 更新购物车商品数量
 * - DELETE /store/:slug/cart/items/:itemId - 删除购物车商品
 *
 * 认证说明：
 * - 所有路由使用 OptionalStoreAuthGuard，支持游客和已登录用户
 * - 游客必须通过 x-cart-session header 传递会话 ID
 *
 * @controller StoreCartController
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { OptionalStoreAuthGuard } from '../../auth/guards/optional-store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { StoreCartService } from './store-cart.service';

/**
 * 购物车控制器
 * 提供购物车 CRUD 操作的 HTTP 端点
 */
@Controller('store/:slug/cart')
@Public()  // 允许公开访问
@UseGuards(OptionalStoreAuthGuard)  // 可选认证：支持游客和已登录用户
export class StoreCartController {
  /**
   * 构造函数 - 注入购物车服务
   * @param cartService - 购物车服务
   */
  constructor(private readonly cartService: StoreCartService) {}

  /**
   * 获取购物车接口
   *
   * @route GET /store/:slug/cart
   * @param slug - 商户商店的 URL 标识
   * @param sessionId - 游客会话 ID（通过 x-cart-session header）
   * @param user - 当前用户（OptionalStoreAuthGuard 提供）
   * @returns 购物车信息
   */
  @Get()
  getCart(
    @Param('slug') slug: string,
    @Headers('x-cart-session') sessionId: string | undefined,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.cartService.getCart(slug, sessionId, user);
  }

  /**
   * 添加商品到购物车接口
   *
   * @route POST /store/:slug/cart/items
   * @param slug - 商户商店的 URL 标识
   * @param dto - 添加商品信息（variantId, quantity）
   * @param sessionId - 游客会话 ID（通过 x-cart-session header）
   * @param user - 当前用户（OptionalStoreAuthGuard 提供）
   * @returns 201 - 更新后的购物车信息
   */
  @Post('items')
  @HttpCode(201)
  addItem(
    @Param('slug') slug: string,
    @Body() dto: AddCartItemDto,
    @Headers('x-cart-session') sessionId: string | undefined,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.cartService.addItem(slug, dto, sessionId, user);
  }

  /**
   * 更新购物车商品数量接口
   *
   * @route PATCH /store/:slug/cart/items/:itemId
   * @param slug - 商户商店的 URL 标识
   * @param itemId - 购物车商品 ID
   * @param dto - 更新信息（quantity）
   * @param sessionId - 游客会话 ID（通过 x-cart-session header）
   * @param user - 当前用户（OptionalStoreAuthGuard 提供）
   * @returns 更新后的购物车信息
   */
  @Patch('items/:itemId')
  updateItem(
    @Param('slug') slug: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Headers('x-cart-session') sessionId: string | undefined,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.cartService.updateItem(slug, itemId, dto, sessionId, user);
  }

  /**
   * 删除购物车商品接口
   *
   * @route DELETE /store/:slug/cart/items/:itemId
   * @param slug - 商户商店的 URL 标识
   * @param itemId - 购物车商品 ID
   * @param sessionId - 游客会话 ID（通过 x-cart-session header）
   * @param user - 当前用户（OptionalStoreAuthGuard 提供）
   * @returns 更新后的购物车信息
   */
  @Delete('items/:itemId')
  removeItem(
    @Param('slug') slug: string,
    @Param('itemId') itemId: string,
    @Headers('x-cart-session') sessionId: string | undefined,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.cartService.removeItem(slug, itemId, sessionId, user);
  }
}
