import { Module } from '@nestjs/common';
import { CommissionQueueService } from './commission-queue.service';
import { EmailQueueService } from './email-queue.service';
import { InventoryQueueService } from './inventory-queue.service';

@Module({
  providers: [EmailQueueService, CommissionQueueService, InventoryQueueService],
  exports: [EmailQueueService, CommissionQueueService, InventoryQueueService],
})
export class QueueModule {}
