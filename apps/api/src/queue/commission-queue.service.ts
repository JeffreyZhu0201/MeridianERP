import { Injectable } from '@nestjs/common';

@Injectable()
export class CommissionQueueService {
  async enqueueAccrual(orderId: string): Promise<void> {
    // BullMQ stub — enqueue commission.order.accrue in production
    void orderId;
  }
}
