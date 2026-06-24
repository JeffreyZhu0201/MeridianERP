import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommissionModule } from '../commission/commission.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentModule } from '../payment/payment.module';
import { QueueModule } from '../queue/queue.module';
import { StoreAuthController } from './auth/store-auth.controller';
import { StoreAuthService } from './auth/store-auth.service';
import { StoreCatalogController } from './catalog/store-catalog.controller';
import { StoreCatalogService } from './catalog/store-catalog.service';
import { StoreCartController } from './cart/store-cart.controller';
import { StoreCartService } from './cart/store-cart.service';
import { StoreCheckoutController } from './checkout/store-checkout.controller';
import { StoreCheckoutService } from './checkout/store-checkout.service';
import { StoreTenantService } from './common/store-tenant.service';

@Module({
  imports: [AuthModule, PaymentModule, CommissionModule, QueueModule, InventoryModule],
  controllers: [
    StoreAuthController,
    StoreCatalogController,
    StoreCartController,
    StoreCheckoutController,
  ],
  providers: [
    StoreTenantService,
    StoreAuthService,
    StoreCatalogService,
    StoreCartService,
    StoreCheckoutService,
  ],
  exports: [StoreTenantService, StoreAuthService],
})
export class StoreModule {}
