import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { PlatformAdminsModule } from './admins/platform-admins.module';
import { PlatformAccountsModule } from './accounts/platform-accounts.module';
import { PlatformAuthModule } from './auth/platform-auth.module';
import { PlatformDashboardModule } from './dashboard/platform-dashboard.module';
import { PlatformMerchantsModule } from './merchants/platform-merchants.module';
import { PlatformUsersModule } from './users/platform-users.module';
import { PlatformInventoryModule } from './inventory/platform-inventory.module';
import { PlatformSettingsModule } from './settings/platform-settings.module';
import { PlatformDistributorsModule } from './distributors/platform-distributors.module';
import { PlatformAllocationsModule } from './allocations/platform-allocations.module';
import { FlagshipCatalogModule } from './flagship-catalog/flagship-catalog.module';
import { PlatformWithdrawalsModule } from './withdrawals/platform-withdrawals.module';
import { PlatformReplenishmentModule } from './replenishment/platform-replenishment.module';
import { PlatformFundsModule } from './funds/platform-funds.module';
import { PlatformCrmModule } from './crm/platform-crm.module';
import { PlatformOrdersController } from './orders/platform-orders.controller';
import { PlatformOrdersService } from './orders/platform-orders.service';
import { PlatformSettlementsController } from './settlements/platform-settlements.controller';
import { PlatformSettlementsService } from './settlements/platform-settlements.service';

@Module({
  imports: [
    PlatformAccountsModule,
    PlatformAdminsModule,
    PlatformAuthModule,
    PlatformDashboardModule,
    PlatformMerchantsModule,
    PlatformUsersModule,
    PlatformInventoryModule,
    PlatformSettingsModule,
    PlatformDistributorsModule,
    PlatformAllocationsModule,
    FlagshipCatalogModule,
    PlatformWithdrawalsModule,
    PlatformReplenishmentModule,
    PlatformFundsModule,
    PlatformCrmModule,
    FulfillmentModule,
    AuthModule,
  ],
  controllers: [PlatformOrdersController, PlatformSettlementsController],
  providers: [PlatformOrdersService, PlatformSettlementsService],
})
export class PlatformModule {}
