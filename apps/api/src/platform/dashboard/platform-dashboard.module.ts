import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PlatformDashboardController } from './platform-dashboard.controller';
import { PlatformDashboardService } from './platform-dashboard.service';

@Module({
  imports: [AuthModule],
  controllers: [PlatformDashboardController],
  providers: [PlatformDashboardService],
})
export class PlatformDashboardModule {}
