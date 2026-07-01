import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { MerchantFundsService } from '../../platform/funds/platform-funds.service';
import type { DateRangeQuery } from '@meridian/shared';

/**
 * 商户资金控制器 (MerchantFundsController)
 *
 * 提供商户资金相关 API：
 * - GET /merchant/funds/summary - 获取资金汇总
 *
 * 实际资金服务由 PlatformFundsModule 中的 MerchantFundsService 提供，
 * 这里只是透传调用。
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/funds')
@UseGuards(MerchantAuthGuard)
export class MerchantFundsController {
  constructor(private readonly service: MerchantFundsService) {}

  @Get('summary')
  getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DateRangeQuery,
  ) {
    return this.service.getSummary(user.tenantId!, query);
  }
}
