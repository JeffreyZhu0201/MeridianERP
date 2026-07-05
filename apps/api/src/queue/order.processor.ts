import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ORDER_QUEUE, OrderJobName } from '@meridian/shared';
import { PlatformAllocationsService } from '../platform/allocations/platform-allocations.service';
import { AllocationExpiryService } from '../orders/allocation-expiry.service';
import { OrderLifecycleService } from '../orders/order-lifecycle.service';
import { SettlementReminderService } from '../orders/settlement-reminder.service';

@Processor(ORDER_QUEUE)
export class OrderProcessor extends WorkerHost {
  constructor(
    private readonly orderLifecycle: OrderLifecycleService,
    private readonly allocationExpiry: AllocationExpiryService,
    private readonly settlementReminder: SettlementReminderService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === OrderJobName.EXPIRE_PENDING) {
      await this.orderLifecycle.expirePendingOrders();
      return;
    }
    if (job.name === OrderJobName.EXPIRE_ISSUED_ALLOCATIONS) {
      await this.allocationExpiry.expireIssuedAllocations();
      return;
    }
    if (job.name === OrderJobName.SETTLEMENT_REMINDER) {
      await this.settlementReminder.remindStaleAccruedCommissions();
    }
  }
}
