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
}
