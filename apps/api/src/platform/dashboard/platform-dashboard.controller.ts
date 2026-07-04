import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformDashboardService } from './platform-dashboard.service';

@Controller('platform/dashboard')
@UseGuards(PlatformAuthGuard)
export class PlatformDashboardController {
  constructor(
    private readonly platformDashboardService: PlatformDashboardService,
  ) {}

  @Get()
  getStats() {
    return this.platformDashboardService.getStats();
  }
}
