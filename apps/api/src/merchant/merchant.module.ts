import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { PlatformAllocationsModule } from '../platform/allocations/platform-allocations.module';
import { PlatformFundsModule } from '../platform/funds/platform-funds.module';
import { MerchantAuthController } from './auth/merchant-auth.controller';
import { MerchantAuthService } from './auth/merchant-auth.service';
import { MerchantCategoriesController } from './catalog/categories.controller';
import { MerchantCategoriesService } from './catalog/categories.service';
import { MerchantProductsController } from './catalog/products.controller';
import { MerchantProductsService } from './catalog/products.service';
import { OnboardingController } from './onboarding/onboarding.controller';
import { OnboardingService } from './onboarding/onboarding.service';
import { CompaniesController } from './crm/companies/companies.controller';
import { CompaniesService } from './crm/companies/companies.service';
import { ContactsController } from './crm/contacts/contacts.controller';
import { ContactsService } from './crm/contacts/contacts.service';
import { LeadsController } from './crm/leads/leads.controller';
import { LeadsService } from './crm/leads/leads.service';
import { ActivitiesController } from './crm/activities/activities.controller';
import { ActivitiesService } from './crm/activities/activities.service';
import { CommissionsModule } from './commissions/commissions.module';
import { DistributorsController } from './distributors/distributors.controller';
import { DistributorsService } from './distributors/distributors.service';
import { InventoryModule } from '../inventory/inventory.module';
import { MerchantInventoryModule } from './inventory/merchant-inventory.module';
import { MerchantOrdersController } from './orders/merchant-orders.controller';
import { MerchantOrdersService } from './orders/merchant-orders.service';
import { MerchantFundsController } from './funds/merchant-funds.controller';
import { MerchantReplenishmentController } from './replenishment/merchant-replenishment.controller';
import { MerchantReplenishmentService } from './replenishment/merchant-replenishment.service';
import { MerchantAllocationsController } from './allocations/merchant-allocations.controller';
import { MerchantDashboardModule } from './dashboard/merchant-dashboard.module';
import { MerchantSettingsModule } from './settings/merchant-settings.module';

@Module({
  imports: [
    AuthModule,
    InventoryModule,
    MerchantInventoryModule,
    CommissionsModule,
    MerchantDashboardModule,
    MerchantSettingsModule,
    FulfillmentModule,
    PlatformAllocationsModule,
    PlatformFundsModule,
  ],
  controllers: [
    MerchantAuthController,
    OnboardingController,
    CompaniesController,
    ContactsController,
    LeadsController,
    ActivitiesController,
    DistributorsController,
    MerchantCategoriesController,
    MerchantProductsController,
    MerchantOrdersController,
    MerchantFundsController,
    MerchantReplenishmentController,
    MerchantAllocationsController,
  ],
  providers: [
    MerchantAuthService,
    OnboardingService,
    CompaniesService,
    ContactsService,
    LeadsService,
    ActivitiesService,
    DistributorsService,
    MerchantCategoriesService,
    MerchantProductsService,
    MerchantOrdersService,
    MerchantReplenishmentService,
  ],
})
export class MerchantModule {}
