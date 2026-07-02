import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { QueueModule } from '../../queue/queue.module';
import { MerchantAdjustmentsController } from './adjustments.controller';
import { MerchantInventoryReportsController } from './reports.controller';
import { MerchantInventorySettingsController } from './settings.controller';
import { MerchantPurchaseOrdersController } from './purchase-orders.controller';
import { MerchantStockLevelsController } from './stock-levels.controller';
import { MerchantTransfersController } from './transfers.controller';
import { MerchantWarehousesController } from './warehouses.controller';
import { MerchantInventoryReportsService } from './merchant-inventory-reports.service';
import { MerchantInventoryService } from './merchant-inventory.service';
import { MerchantPurchaseOrdersService } from './merchant-purchase-orders.service';
import { MerchantStockService } from './merchant-stock.service';
import { MerchantWarehousesService } from './merchant-warehouses.service';
import { MerchantTransfersService } from './transfers.service';

@Module({
  imports: [AuthModule, InventoryModule, QueueModule],
  controllers: [
    MerchantInventorySettingsController,
    MerchantWarehousesController,
    MerchantStockLevelsController,
    MerchantAdjustmentsController,
    MerchantTransfersController,
    MerchantPurchaseOrdersController,
    MerchantInventoryReportsController,
  ],
  providers: [
    MerchantWarehousesService,
    MerchantStockService,
    MerchantPurchaseOrdersService,
    MerchantInventoryReportsService,
    MerchantInventoryService,
    MerchantTransfersService,
  ],
  exports: [MerchantInventoryService, MerchantTransfersService],
})
export class MerchantInventoryModule {}
