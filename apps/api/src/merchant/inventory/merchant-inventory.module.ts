import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { QueueModule } from '../../queue/queue.module';
import { MerchantAdjustmentsController } from './adjustments.controller';
import { MerchantInventoryReportsController } from './reports.controller';
import { MerchantInventorySettingsController } from './settings.controller';
import { MerchantPurchaseOrdersController } from './purchase-orders.controller';
import { MerchantStockLevelsController } from './stock-levels.controller';
import { MerchantWarehousesController } from './warehouses.controller';
import { MerchantInventoryService } from './merchant-inventory.service';

@Module({
  imports: [AuthModule, InventoryModule, QueueModule],
  controllers: [
    MerchantInventorySettingsController,
    MerchantWarehousesController,
    MerchantStockLevelsController,
    MerchantAdjustmentsController,
    MerchantPurchaseOrdersController,
    MerchantInventoryReportsController,
  ],
  providers: [MerchantInventoryService],
  exports: [MerchantInventoryService],
})
export class MerchantInventoryModule {}
