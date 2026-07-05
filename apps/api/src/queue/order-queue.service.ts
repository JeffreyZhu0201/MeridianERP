import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ORDER_QUEUE, OrderJobName } from '@meridian/shared';

@Injectable()
export class OrderQueueService implements OnModuleInit {
  constructor(
    @Optional() @InjectQueue(ORDER_QUEUE) private readonly queue?: Queue,
  ) {}

  async onModuleInit() {
    if (!this.queue || process.env.NODE_ENV === 'test') {
      return;
    }
    await this.queue.add(
      OrderJobName.EXPIRE_PENDING,
      {},
      {
        repeat: { every: 15 * 60 * 1000 },
        jobId: 'orders-expire-pending-repeat',
      },
    );
    await this.queue.add(
      OrderJobName.EXPIRE_ISSUED_ALLOCATIONS,
      {},
      {
        repeat: { every: 24 * 60 * 60 * 1000 },
        jobId: 'orders-expire-allocations-repeat',
      },
    );
    await this.queue.add(
      OrderJobName.SETTLEMENT_REMINDER,
      {},
      {
        repeat: { every: 24 * 60 * 60 * 1000 },
        jobId: 'orders-settlement-reminder-repeat',
      },
    );
  }

  async enqueueExpirePending(): Promise<void> {
    if (!this.queue) {
      return;
    }
    await this.queue.add(OrderJobName.EXPIRE_PENDING, {});
  }
}
