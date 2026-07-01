import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PlatformOrdersService } from './platform-orders.service';

/**
 * 平台订单控制器 - 提供平台订单管理的 API 端点
 *
 * 端点：
 * GET /platform/orders - 分页查询订单列表
 * GET /platform/orders/:id - 获取订单详情
 * POST /platform/orders/:id/ship - 发起配送发货
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/orders')
@UseGuards(PlatformAuthGuard)
export class PlatformOrdersController {
  constructor(private readonly ordersService: PlatformOrdersService) {}

  /**
   * 分页查询订单列表
   *
   * 支持筛选：状态、履约类型
   * 支持分页：page、limit
   *
   * @param page - 页码（默认1）
   * @param limit - 每页数量（默认20）
   * @param status - 订单状态筛选
   * @param fulfillmentType - 履约类型筛选（DELIVERY/PICKUP）
   * @returns 订单分页列表
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('fulfillmentType') fulfillmentType?: string,
  ) {
    return this.ordersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
      fulfillmentType,
    );
  }

  /**
   * 获取订单详情
   *
   * @param id - 订单 ID
   * @returns 订单详细信息
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  /**
   * 发起配送发货
   *
   * 平台管理员为商户订单发起配送操作。
   * 操作人信息从 JWT 中获取。
   *
   * @param user - 当前登录的平台用户（从 JWT 解码）
   * @param id - 订单 ID
   * @returns 发货结果
   */
  @Post(':id/ship')
  @HttpCode(200)
  ship(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.ship(id, user.userId);
  }
}
