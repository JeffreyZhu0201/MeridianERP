import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  BindingCreatedEmailPayload,
  CommissionAccruedEmailPayload,
  DEFAULT_QUEUE_ATTEMPTS,
  DEFAULT_QUEUE_BACKOFF_MS,
  EmailJobName,
  EMAIL_QUEUE,
} from '@meridian/shared';

const DEFAULT_JOB_OPTIONS = {
  attempts: DEFAULT_QUEUE_ATTEMPTS,
  backoff: { type: 'exponential' as const, delay: DEFAULT_QUEUE_BACKOFF_MS },
};

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @Optional() @InjectQueue(EMAIL_QUEUE) private readonly queue?: Queue,
  ) {}

  
  async sendMerchantWelcome(email: string, businessName: string): Promise<void> {
    await this.enqueue(EmailJobName.MERCHANT_WELCOME, { email, businessName });
  }

  
  async sendMerchantRejected(email: string, reason: string): Promise<void> {
    await this.enqueue(EmailJobName.MERCHANT_REJECTED, { email, reason });
  }

  
  async sendBindingCreated(payload: BindingCreatedEmailPayload): Promise<void> {
    await this.enqueue(EmailJobName.DISTRIBUTOR_BINDING_CREATED, payload);
  }

  
  async sendCommissionAccrued(
    payload: CommissionAccruedEmailPayload,
  ): Promise<void> {
    await this.enqueue(EmailJobName.COMMISSION_ACCRUED, payload);
  }

  
  async sendOrderConfirmation(
    tenantId: string,
    orderId: string,
    email: string,
  ): Promise<void> {
    await this.enqueue(EmailJobName.ORDER_CONFIRMATION, {
      tenantId,
      orderId,
      email,
    });
  }

  
  private async enqueue(name: string, payload: unknown): Promise<void> {
    if (this.queue) {
      await this.queue.add(name, payload, DEFAULT_JOB_OPTIONS);
      return;
    }
    this.logger.log(`[email queue stub] ${name}: ${JSON.stringify(payload)}`);
  }
}
