import { Module } from '@nestjs/common';
import { CommissionQueueService } from './commission-queue.service';
import { EmailQueueService } from './email-queue.service';

@Module({
  providers: [EmailQueueService, CommissionQueueService],
  exports: [EmailQueueService, CommissionQueueService],
})
export class QueueModule {}
