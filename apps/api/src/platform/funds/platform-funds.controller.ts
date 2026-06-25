import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformFundsService } from './platform-funds.service';
import type { DateRangeQuery } from '@meridian/shared';

@Controller('platform/funds')
@UseGuards(PlatformAuthGuard)
export class PlatformFundsController {
  constructor(private readonly service: PlatformFundsService) {}

  @Get('summary')
  getSummary(@Query() query: DateRangeQuery) {
    return this.service.getSummary(query);
  }
}
