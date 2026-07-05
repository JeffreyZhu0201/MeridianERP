import { Module } from '@nestjs/common';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { PaymentModule } from '../payment/payment.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderLifecycleService } from './order-lifecycle.service';
import { AllocationExpiryService } from './allocation-expiry.service';
import { SettlementReminderService } from './settlement-reminder.service';

@Module({
  imports: [PrismaModule, PaymentModule, FulfillmentModule],
  providers: [
    OrderLifecycleService,
    AllocationExpiryService,
    SettlementReminderService,
  ],
  exports: [
    OrderLifecycleService,
    AllocationExpiryService,
    SettlementReminderService,
  ],
})
export class OrderLifecycleModule {}
