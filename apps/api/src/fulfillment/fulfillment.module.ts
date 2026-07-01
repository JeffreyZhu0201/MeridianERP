/**
 * 履约模块 (FulfillmentModule)
 *
 * ============================================================
 * 模块职责
 * ============================================================
 *
 * 履约模块负责处理订单的最终交付环节，包括：
 * - PICKUP（自提）：消费者到商户门店提货
 * - DELIVERY（配送）：平台总部向商户仓库发货
 *
 * ============================================================
 * 依赖关系
 * ============================================================
 *
 * FulfillmentService 依赖以下服务：
 *
 * - PrismaService：数据库操作（订单、库存、台账）
 * - InventoryService：库存扣减和缓存同步
 * - CommissionService：履约完成后触发佣金计算
 *
 * ============================================================
 * 导出说明
 * ============================================================
 *
 * 模块导出 FulfillmentService，供其他模块使用：
 *
 * - MerchantModule：商户订单核销自提
 * - PlatformModule：平台操作配送发货
 *
 * @see FulfillmentService 履约服务核心实现
 */
import { Module } from '@nestjs/common';
import { CommissionModule } from '../commission/commission.module';
import { InventoryModule } from '../inventory/inventory.module';
import { FulfillmentService } from './fulfillment.service';

@Module({
  imports: [InventoryModule, CommissionModule],
  providers: [FulfillmentService],
  exports: [FulfillmentService],
})
export class FulfillmentModule {}
