import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { MerchantOwnerGuard } from '../../auth/guards/merchant-owner.guard';
import { PaymentModule } from '../../payment/payment.module';
import { PlatformAccountsModule } from '../../platform/accounts/platform-accounts.module';
import { MerchantSettingsController } from './merchant-settings.controller';
import { MerchantSettingsService } from './merchant-settings.service';
import { MerchantProcurementAddressesController } from './merchant-procurement-addresses.controller';
import { MerchantProcurementAddressesService } from './merchant-procurement-addresses.service';
import { MerchantTeamController } from './merchant-team.controller';

@Module({
  imports: [AuthModule, PaymentModule, PlatformAccountsModule, InventoryModule],
  controllers: [
    MerchantSettingsController,
    MerchantProcurementAddressesController,
    MerchantTeamController,
  ],
  providers: [
    MerchantSettingsService,
    MerchantProcurementAddressesService,
    MerchantOwnerGuard,
  ],
  exports: [MerchantSettingsService, MerchantProcurementAddressesService],
})
export class MerchantSettingsModule {}
