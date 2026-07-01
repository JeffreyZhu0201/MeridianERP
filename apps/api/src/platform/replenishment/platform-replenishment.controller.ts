import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReplenishmentRequestStatus } from '@prisma/client';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PlatformReplenishmentService } from './platform-replenishment.service';

/**
 * 平台补货控制器 - 提供商户补货请求管理的 API 端点
 *
 * 端点：
 * GET /platform/replenishment - 查询补货请求列表
 * POST /platform/replenishment/:id/approve - 批准补货请求
 * POST /platform/replenishment/:id/reject - 拒绝补货请求
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/replenishment')
@UseGuards(PlatformAuthGuard)
export class PlatformReplenishmentController {
  constructor(private readonly service: PlatformReplenishmentService) {}

  /**
   * 查询补货请求列表
   *
   * @param status - 可选，按状态筛选
   * @returns 补货请求列表
   */
  @Get()
  list(@Query('status') status?: ReplenishmentRequestStatus) {
    return this.service.list(status);
  }

  /**
   * 批准补货请求
   *
   * 批准后自动创建配额分配并发放给商户。
   *
   * @param user - 当前登录的平台用户
   * @param id - 补货请求 ID
   * @returns 批准后的补货请求
   */
  @Post(':id/approve')
  @HttpCode(200)
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.approve(id, user.userId);
  }

  /**
   * 拒绝补货请求
   *
   * @param user - 当前登录的平台用户
   * @param id - 补货请求 ID
   * @param body - 包含拒绝原因
   * @returns 拒绝后的补货请求
   */
  @Post(':id/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.service.reject(id, user.userId, body.reason);
  }
}
