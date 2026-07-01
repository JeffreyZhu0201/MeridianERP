/**
 * StoreBindingsController - 商店绑定控制器
 *
 * 处理商店消费者与经销商之间的绑定请求。
 *
 * 路由结构：
 * - POST /store/:slug/bindings/claim - 认领/绑定到经销商
 *
 * 认证要求：
 * - 需要已登录的消费者（StoreAuthGuard）
 *
 * HTTP 状态码：
 * - 200: 已存在绑定关系
 * - 201: 新建绑定关系
 *
 * @controller StoreBindingsController
 */

import {
  Body,
  Controller,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { StoreAuthGuard } from '../../auth/guards/store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { ClaimBindingDto } from '../../bindings/dto/claim-binding.dto';
import { StoreBindingsService } from './store-bindings.service';

/**
 * 商店绑定控制器
 * 提供经销商绑定功能的 HTTP 端点
 */
@Controller('store/:slug/bindings')
@UseGuards(StoreAuthGuard)  // 需要已登录的消费者
export class StoreBindingsController {
  /**
   * 构造函数 - 注入绑定服务
   * @param storeBindingsService - 商店绑定服务
   */
  constructor(private readonly storeBindingsService: StoreBindingsService) {}

  /**
   * 认领绑定令牌接口
   *
   * 功能：消费者使用经销商分享的令牌，绑定到该经销商
   *
   * @route POST /store/:slug/bindings/claim
   * @param slug - 商户商店的 URL 标识
   * @param user - 当前登录用户（由 StoreAuthGuard 提供）
   * @param dto - 绑定令牌（token）
   * @param res - Express 响应对象（用于设置状态码）
   * @returns 200 或 201 - 绑定结果（不包含 isExisting 字段）
   *
   * 状态码说明：
   * - 200: 该消费者之前已绑定过该经销商
   * - 201: 新建绑定关系
   */
  @Post('claim')
  async claim(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ClaimBindingDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 调用服务执行绑定
    const result = await this.storeBindingsService.claim(slug, user, dto);

    // 根据是否为已存在的绑定设置状态码
    res.status(result.isExisting ? 200 : 201);

    // 返回结果，移除 isExisting 字段
    const { isExisting: _, ...body } = result;
    return body;
  }
}
