import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import type {
  DeliveryOrderInsightRequest,
  FundsInsightRequest,
  WithdrawalInsightRequest,
} from '@meridian/shared';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import { DeliveryOrderInsightService } from './delivery-order-insight.service';
import { FundsInsightService } from './funds-insight.service';
import { WithdrawalInsightService } from './withdrawal-insight.service';

@Controller('platform/ai/insights')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
export class PlatformAiInsightsController {
  constructor(
    private readonly withdrawalInsight: WithdrawalInsightService,
    private readonly deliveryOrderInsight: DeliveryOrderInsightService,
    private readonly fundsInsight: FundsInsightService,
  ) {}

  @Post('withdrawal')
  @HttpCode(201)
  @PlatformRoles('SUPER_ADMIN', 'FINANCE', 'REVIEWER')
  withdrawal(@Body() body: WithdrawalInsightRequest) {
    return this.withdrawalInsight.insight(body);
  }

  @Post('delivery-order')
  @HttpCode(201)
  @PlatformRoles('SUPER_ADMIN', 'FULFILLMENT')
  deliveryOrder(@Body() body: DeliveryOrderInsightRequest) {
    return this.deliveryOrderInsight.insight(body);
  }

  @Post('funds')
  @HttpCode(201)
  @PlatformRoles('SUPER_ADMIN', 'FINANCE')
  funds(@Body() body: FundsInsightRequest) {
    return this.fundsInsight.insight(body);
  }
}
