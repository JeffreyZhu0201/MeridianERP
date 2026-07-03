import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { MerchantOwnerGuard } from '../../auth/guards/merchant-owner.guard';
import { PaymentModule } from '../../payment/payment.module';
import { PlatformAccountsModule } from '../../platform/accounts/platform-accounts.module';
import { MerchantSettingsController } from './merchant-settings.controller';
import { MerchantSettingsService } from './merchant-settings.service';
import { MerchantTeamController } from './merchant-team.controller';

@Module({
  imports: [AuthModule, PaymentModule, PlatformAccountsModule],
  controllers: [MerchantSettingsController, MerchantTeamController],
  providers: [MerchantSettingsService, MerchantOwnerGuard],
  exports: [MerchantSettingsService],
})
export class MerchantSettingsModule {}
