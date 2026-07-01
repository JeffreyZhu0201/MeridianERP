import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { PlatformAuthModule } from './auth/platform-auth.module';
import { PlatformDashboardModule } from './dashboard/platform-dashboard.module';
import { PlatformMerchantsModule } from './merchants/platform-merchants.module';
import { PlatformInventoryModule } from './inventory/platform-inventory.module';
import { PlatformSettingsModule } from './settings/platform-settings.module';
import { PlatformDistributorsModule } from './distributors/platform-distributors.module';
import { PlatformAllocationsModule } from './allocations/platform-allocations.module';
import { PlatformWithdrawalsModule } from './withdrawals/platform-withdrawals.module';
import { PlatformReplenishmentModule } from './replenishment/platform-replenishment.module';
import { PlatformFundsModule } from './funds/platform-funds.module';
import { PlatformCrmModule } from './crm/platform-crm.module';
import { PlatformOrdersController } from './orders/platform-orders.controller';
import { PlatformOrdersService } from './orders/platform-orders.service';
import { PlatformSettlementsController } from './settlements/platform-settlements.controller';
import { PlatformSettlementsService } from './settlements/platform-settlements.service';

/**
 * 平台模块 - 聚合所有平台级功能
 *
 * 包含的子模块：
 * - PlatformAuthModule: 平台管理员认证
 * - PlatformDashboardModule: 平台仪表盘
 * - PlatformMerchantsModule: 商户管理（审批、经销商分配）
 * - PlatformInventoryModule: 跨租户库存查看
 * - PlatformSettingsModule: 平台设置
 * - PlatformDistributorsModule: 渠道经销商管理
 * - PlatformAllocationsModule: 配额管理（Master SKU、分配）
 * - PlatformWithdrawalsModule: 经销商提现审批
 * - PlatformReplenishmentModule: 商户补货请求审批
 * - PlatformFundsModule: 平台资金概览
 * - PlatformCrmModule: 平台 CRM（公司、联系人、线索）
 *
 * 共享依赖：
 * - FulfillmentModule: 履约服务（配送发货）
 * - AuthModule: 通用认证
 */
@Module({
  imports: [
    PlatformAuthModule,
    PlatformDashboardModule,
    PlatformMerchantsModule,
    PlatformInventoryModule,
    PlatformSettingsModule,
    PlatformDistributorsModule,
    PlatformAllocationsModule,
    PlatformWithdrawalsModule,
    PlatformReplenishmentModule,
    PlatformFundsModule,
    PlatformCrmModule,
    FulfillmentModule,
    AuthModule,
  ],
  controllers: [
    PlatformOrdersController,
    PlatformSettlementsController,
  ],
  providers: [PlatformOrdersService, PlatformSettlementsService],
})
export class PlatformModule {}
