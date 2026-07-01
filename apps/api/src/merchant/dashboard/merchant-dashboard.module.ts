/**
 * 商户仪表盘模块 (MerchantDashboardModule)
 *
 * 聚合商户仪表盘相关的控制器和服务。
 */
import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { MerchantDashboardController } from './merchant-dashboard.controller';
import { MerchantDashboardService } from './merchant-dashboard.service';

@Module({
  imports: [AuthModule],
  controllers: [MerchantDashboardController],
  providers: [MerchantDashboardService],
})
export class MerchantDashboardModule {}
