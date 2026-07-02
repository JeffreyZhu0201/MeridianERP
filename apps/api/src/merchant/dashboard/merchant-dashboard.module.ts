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
