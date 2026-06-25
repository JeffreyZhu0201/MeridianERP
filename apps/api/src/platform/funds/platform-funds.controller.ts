import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformFundsService } from './platform-funds.service';

@Controller('platform/funds')
@UseGuards(PlatformAuthGuard)
export class PlatformFundsController {
  constructor(private readonly service: PlatformFundsService) {}

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }
}
