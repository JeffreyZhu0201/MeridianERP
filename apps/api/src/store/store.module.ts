/**
 * StoreModule - 商店前端模块
 *
 * 该模块是商店消费者（Customer）角色的后端核心模块，提供以下功能：
 * - 用户认证：注册、登录、JWT 令牌签发
 * - 购物车：增删改查购物车商品
 * - 商品目录：浏览商品和商品详情
 * - 订单管理：查看订单列表、订单详情、自提二维码
 * - 结账流程：创建订单、模拟支付、支付成功回调
 * - 经销商绑定：消费者绑定到特定经销商
 * - 商店列表：获取已审批的商户商店列表
 *
 * 认证策略：使用独立的 JWT_STORE_SECRET 签发 'store' 受众的 JWT
 * 多租户：通过 slug 参数隔离不同商户的数据
 *
 * @module store
 */
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BindingsModule } from '../bindings/bindings.module';
import { CommissionModule } from '../commission/commission.module';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentModule } from '../payment/payment.module';
import { QueueModule } from '../queue/queue.module';
import { StoreAuthController } from './auth/store-auth.controller';
import { StoreAuthService } from './auth/store-auth.service';
import { StoreBindingsController } from './bindings/store-bindings.controller';
import { StoreBindingsService } from './bindings/store-bindings.service';
import { StoreCatalogController } from './catalog/store-catalog.controller';
import { StoreCatalogService } from './catalog/store-catalog.service';
import { StoreCartController } from './cart/store-cart.controller';
import { StoreCartService } from './cart/store-cart.service';
import { StoreCheckoutController } from './checkout/store-checkout.controller';
import { StoreCheckoutService } from './checkout/store-checkout.service';
import { StoreOrdersController } from './orders/store-orders.controller';
import { StoreOrdersService } from './orders/store-orders.service';
import { StoreStoresController } from './stores/store-stores.controller';
import { StoreStoresService } from './stores/store-stores.service';
import { StoreTenantService } from './common/store-tenant.service';

@Module({
  imports: [AuthModule, BindingsModule, PaymentModule, CommissionModule, QueueModule, InventoryModule, FulfillmentModule],
  controllers: [
    StoreAuthController,
    StoreBindingsController,
    StoreCatalogController,
    StoreCartController,
    StoreCheckoutController,
    StoreOrdersController,
    StoreStoresController,
  ],
  providers: [
    StoreTenantService,
    StoreAuthService,
    StoreBindingsService,
    StoreCatalogService,
    StoreCartService,
    StoreCheckoutService,
    StoreOrdersService,
    StoreStoresService,
  ],
  exports: [StoreTenantService, StoreAuthService],
})
export class StoreModule {}
