import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PlatformDashboardController } from './platform-dashboard.controller';
import { PlatformDashboardService } from './platform-dashboard.service';

/**
 * 平台仪表盘模块
 *
 * 提供平台运营数据统计功能。
 */
@Module({
  imports: [AuthModule],
  controllers: [PlatformDashboardController],
  providers: [PlatformDashboardService],
})
export class PlatformDashboardModule {}
