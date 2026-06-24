import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlatformAuthModule } from './auth/platform-auth.module';
import { PlatformMerchantsModule } from './merchants/platform-merchants.module';
import { PlatformInventoryModule } from './inventory/platform-inventory.module';
import { PlatformOrdersController } from './orders/platform-orders.controller';
import { PlatformOrdersService } from './orders/platform-orders.service';
import { PlatformSettlementsController } from './settlements/platform-settlements.controller';
import { PlatformSettlementsService } from './settlements/platform-settlements.service';

@Module({
  imports: [PlatformAuthModule, PlatformMerchantsModule, PlatformInventoryModule, AuthModule],
  controllers: [
    PlatformOrdersController,
    PlatformSettlementsController,
  ],
  providers: [PlatformOrdersService, PlatformSettlementsService],
})
export class PlatformModule {}
