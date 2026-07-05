import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import { PlatformFundsService } from './platform-funds.service';
import type { DateRangeQuery } from '@meridian/shared';

@Controller('platform/funds')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@PlatformRoles('SUPER_ADMIN', 'FINANCE')
export class PlatformFundsController {
  constructor(private readonly service: PlatformFundsService) {}

  @Get('summary')
  getSummary(@Query() query: DateRangeQuery) {
    return this.service.getSummary(query);
  }

  @Get('overview')
  getOverview(@Query() query: DateRangeQuery) {
    return this.service.getOverview(query);
  }

  @Get('inventory-cost')
  getInventoryCost(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getInventoryCostDetail(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Get('expected-profit')
  getExpectedProfit(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getExpectedProfitDetail(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Get('procurement')
  getProcurement(
    @Query() query: DateRangeQuery,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getProcurementDetail(
      query,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('commissions')
  getCommissions(
    @Query() query: DateRangeQuery,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getCommissionsDetail(
      query,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('net-profit')
  getNetProfit(@Query() query: DateRangeQuery) {
    return this.service.getNetProfitBreakdown(query);
  }
}
