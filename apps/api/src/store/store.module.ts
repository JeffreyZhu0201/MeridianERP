import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BindingsModule } from '../bindings/bindings.module';
import { CommissionModule } from '../commission/commission.module';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentModule } from '../payment/payment.module';
import { QueueModule } from '../queue/queue.module';
import { PlatformAccountsModule } from '../platform/accounts/platform-accounts.module';
import {
  StoreAuthController,
  StorePlatformAuthController,
} from './auth/store-auth.controller';
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
import { StoreMerchantApplicationController } from './merchant-application/store-merchant-application.controller';
import { StoreMerchantApplicationService } from './merchant-application/store-merchant-application.service';

@Module({
  imports: [AuthModule, BindingsModule, PaymentModule, CommissionModule, QueueModule, InventoryModule, FulfillmentModule, PlatformAccountsModule],
  controllers: [
    StorePlatformAuthController,
    StoreAuthController,
    StoreBindingsController,
    StoreCatalogController,
    StoreCartController,
    StoreCheckoutController,
    StoreOrdersController,
    StoreStoresController,
    StoreMerchantApplicationController,
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
    StoreMerchantApplicationService,
  ],
  exports: [StoreTenantService, StoreAuthService],
})
export class StoreModule {}
