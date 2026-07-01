/**
 * 商户库存模块 (MerchantInventoryModule)
 *
 * 聚合商户库存相关的所有控制器和服务。
 *
 * 子控制器：
 * - MerchantInventorySettingsController: 库存设置
 * - MerchantWarehousesController: 仓库管理
 * - MerchantStockLevelsController: 库存水平查询
 * - MerchantAdjustmentsController: 库存调整
 * - MerchantTransfersController: 库存调拨
 * - MerchantPurchaseOrdersController: 采购订单
 * - MerchantInventoryReportsController: 库存报表
 *
 * 依赖模块：
 * - AuthModule: 认证
 * - InventoryModule: 基础库存服务
 * - QueueModule: 队列服务（低库存检查）
 */
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
import { MerchantInventoryService } from './merchant-inventory.service';
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
  providers: [MerchantInventoryService, MerchantTransfersService],
  exports: [MerchantInventoryService, MerchantTransfersService],
})
export class MerchantInventoryModule {}
