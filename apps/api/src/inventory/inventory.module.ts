import { Module, forwardRef } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { InventoryService } from './inventory.service';

@Module({
  imports: [forwardRef(() => QueueModule)],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
