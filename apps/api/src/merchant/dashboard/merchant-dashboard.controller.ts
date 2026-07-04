import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { MerchantDashboardService } from './merchant-dashboard.service';

@Controller('merchant/dashboard')
@UseGuards(MerchantAuthGuard)
export class MerchantDashboardController {
  constructor(private readonly dashboardService: MerchantDashboardService) {}

  @Get()
  getStats(
    @CurrentUser() user: AuthenticatedUser,
    @Query('days') days?: string,
  ) {
    const windowDays = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getStats(user.tenantId!, windowDays);
  }
}
