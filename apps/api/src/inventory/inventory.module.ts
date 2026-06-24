import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { InventoryService } from './inventory.service';

@Module({
  imports: [QueueModule],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
