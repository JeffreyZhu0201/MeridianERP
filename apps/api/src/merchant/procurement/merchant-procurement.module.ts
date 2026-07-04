import { Module } from '@nestjs/common';
import { InventoryModule } from '../../inventory/inventory.module';
import { PaymentModule } from '../../payment/payment.module';
import { PlatformAllocationsModule } from '../../platform/allocations/platform-allocations.module';
import { MerchantInventoryModule } from '../inventory/merchant-inventory.module';
import { MerchantSettingsModule } from '../settings/merchant-settings.module';
import { MerchantProcurementController } from './merchant-procurement.controller';
import { MerchantProcurementService } from './merchant-procurement.service';

@Module({
  imports: [
    InventoryModule,
    MerchantInventoryModule,
    PlatformAllocationsModule,
    PaymentModule,
    MerchantSettingsModule,
  ],
  controllers: [MerchantProcurementController],
  providers: [MerchantProcurementService],
  exports: [MerchantProcurementService],
})
export class MerchantProcurementModule {}
