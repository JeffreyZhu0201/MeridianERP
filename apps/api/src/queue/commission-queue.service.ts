import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  CommissionJobName,
  CommissionAccrueJobPayload,
  DEFAULT_QUEUE_ATTEMPTS,
  DEFAULT_QUEUE_BACKOFF_MS,
  COMMISSION_QUEUE,
} from '@meridian/shared';

const DEFAULT_JOB_OPTIONS = {
  attempts: DEFAULT_QUEUE_ATTEMPTS,
  backoff: { type: 'exponential' as const, delay: DEFAULT_QUEUE_BACKOFF_MS },
};

@Injectable()
export class CommissionQueueService {
  private readonly logger = new Logger(CommissionQueueService.name);

  constructor(
    @Optional()
    @InjectQueue(COMMISSION_QUEUE)
    private readonly queue?: Queue,
  ) {}

  
  async enqueueAccrual(orderId: string): Promise<void> {
    const payload: CommissionAccrueJobPayload = { orderId };
    if (this.queue) {
      await this.queue.add(
        CommissionJobName.ORDER_ACCRUE,
        payload,
        DEFAULT_JOB_OPTIONS,
      );
      return;
    }
    this.logger.log(
      `[commission queue stub] ${CommissionJobName.ORDER_ACCRUE}: ${JSON.stringify(payload)}`,
    );
  }
}
