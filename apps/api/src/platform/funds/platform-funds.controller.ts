import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformFundsService } from './platform-funds.service';
import type { DateRangeQuery } from '@meridian/shared';

/**
 * 平台资金控制器 - 提供平台资金相关的 API 端点
 *
 * 端点：
 * GET /platform/funds/summary - 获取平台资金汇总
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/funds')
@UseGuards(PlatformAuthGuard)
export class PlatformFundsController {
  constructor(private readonly service: PlatformFundsService) {}

  /**
   * 获取平台资金汇总
   *
   * 返回平台级别的资金统计信息，包括：
   * - GMV、批发收入、佣金等核心指标
   * - 待处理提现金额
   * - GMV 趋势数据
   *
   * @param query - 可选查询参数：from（起始日期）、to（结束日期）
   * @returns 资金汇总数据
   */
  @Get('summary')
  getSummary(@Query() query: DateRangeQuery) {
    return this.service.getSummary(query);
  }
}
