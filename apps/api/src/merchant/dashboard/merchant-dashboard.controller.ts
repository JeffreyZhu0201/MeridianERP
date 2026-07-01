import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { MerchantDashboardService } from './merchant-dashboard.service';

/**
 * 商户仪表盘控制器 (MerchantDashboardController)
 *
 * 提供商户经营数据统计 API：
 * - GET /merchant/dashboard - 获取仪表盘统计数据
 *
 * @param days 可选，统计周期天数，默认30天
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/dashboard')
@UseGuards(MerchantAuthGuard)
export class MerchantDashboardController {
  constructor(private readonly dashboardService: MerchantDashboardService) {}

  @Get()
  getStats(@CurrentUser() user: AuthenticatedUser, @Query('days') days?: string) {
    const windowDays = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getStats(user.tenantId!, windowDays);
  }
}
