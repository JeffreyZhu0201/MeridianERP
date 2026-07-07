import { Module } from '@nestjs/common';
import { AiModule } from '../../ai/ai.module';
import { AuthModule } from '../../auth/auth.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { QueueModule } from '../../queue/queue.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { MerchantAdjustmentsController } from './adjustments.controller';
import { InventoryAiController } from './ai/inventory-ai.controller';
import { ReplenishmentAiService } from './ai/replenishment-ai.service';
import { MerchantInventoryReportsController } from './reports.controller';
import { MerchantInventorySettingsController } from './settings.controller';
import { MerchantPurchaseOrdersController } from './purchase-orders.controller';
import { MerchantStockLevelsController } from './stock-levels.controller';
import { MerchantInventoryReportsService } from './merchant-inventory-reports.service';
import { MerchantInventoryService } from './merchant-inventory.service';
import { MerchantPurchaseOrdersService } from './merchant-purchase-orders.service';
import { MerchantStockService } from './merchant-stock.service';
import { MerchantWarehousesService } from './merchant-warehouses.service';

@Module({
  imports: [AuthModule, InventoryModule, QueueModule, AiModule, PrismaModule],
  controllers: [
    MerchantInventorySettingsController,
    MerchantStockLevelsController,
    MerchantAdjustmentsController,
    MerchantPurchaseOrdersController,
    MerchantInventoryReportsController,
    InventoryAiController,
  ],
  providers: [
    MerchantWarehousesService,
    MerchantStockService,
    MerchantPurchaseOrdersService,
    MerchantInventoryReportsService,
    MerchantInventoryService,
    ReplenishmentAiService,
  ],
  exports: [MerchantInventoryService, MerchantWarehousesService],
})
export class MerchantInventoryModule {}
