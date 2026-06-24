import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailQueueService {
  async sendMerchantWelcome(email: string, businessName: string): Promise<void> {
    // BullMQ stub — enqueue merchant.welcome in production
    void email;
    void businessName;
  }

  async sendMerchantRejected(email: string, reason: string): Promise<void> {
    // BullMQ stub — enqueue merchant.rejected in production
    void email;
    void reason;
  }
}
