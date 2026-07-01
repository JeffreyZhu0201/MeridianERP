import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformDashboardService } from './platform-dashboard.service';

/**
 * 平台仪表盘控制器 - 提供运营数据统计的 API 端点
 *
 * 端点：
 * GET /platform/dashboard - 获取平台仪表盘统计数据
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/dashboard')
@UseGuards(PlatformAuthGuard)
export class PlatformDashboardController {
  constructor(private readonly platformDashboardService: PlatformDashboardService) {}

  /**
   * 获取平台仪表盘统计数据
   *
   * @returns 平台运营核心指标
   */
  @Get()
  getStats() {
    return this.platformDashboardService.getStats();
  }
}
