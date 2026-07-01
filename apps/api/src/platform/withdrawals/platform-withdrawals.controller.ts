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
import { WithdrawalRequestStatus } from '@prisma/client';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PlatformWithdrawalsService } from './platform-withdrawals.service';

/**
 * 平台提现控制器 - 提供经销商提现管理的 API 端点
 *
 * 端点：
 * GET /platform/withdrawals - 查询提现申请列表
 * POST /platform/withdrawals/:id/approve - 批准提现申请
 * POST /platform/withdrawals/:id/reject - 拒绝提现申请
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/withdrawals')
@UseGuards(PlatformAuthGuard)
export class PlatformWithdrawalsController {
  constructor(private readonly service: PlatformWithdrawalsService) {}

  /**
   * 查询提现申请列表
   *
   * @param status - 可选，按状态筛选
   * @returns 提现申请列表
   */
  @Get()
  list(@Query('status') status?: WithdrawalRequestStatus) {
    return this.service.list(status);
  }

  /**
   * 批准提现申请
   *
   * @param user - 当前登录的平台用户
   * @param id - 提现申请 ID
   * @returns 批准后的提现申请
   */
  @Post(':id/approve')
  @HttpCode(200)
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.approve(id, user.userId);
  }

  /**
   * 拒绝提现申请
   *
   * @param user - 当前登录的平台用户
   * @param id - 提现申请 ID
   * @param dto - 包含拒绝原因
   * @returns 拒绝后的提现申请
   */
  @Post(':id/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: { reason: string },
  ) {
    return this.service.reject(id, user.userId, dto.reason);
  }
}
