/**
 * 商户设置模块 (MerchantSettingsModule)
 *
 * 聚合商户设置和团队管理相关的控制器和服务。
 */
import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { MerchantOwnerGuard } from '../../auth/guards/merchant-owner.guard';
import { PaymentModule } from '../../payment/payment.module';
import { MerchantSettingsController } from './merchant-settings.controller';
import { MerchantSettingsService } from './merchant-settings.service';
import { MerchantTeamController } from './merchant-team.controller';

@Module({
  imports: [AuthModule, PaymentModule],
  controllers: [MerchantSettingsController, MerchantTeamController],
  providers: [MerchantSettingsService, MerchantOwnerGuard],
  exports: [MerchantSettingsService],
})
export class MerchantSettingsModule {}
