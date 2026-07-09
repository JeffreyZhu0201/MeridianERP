import { Injectable, Logger } from '@nestjs/common';
import type { LowStockCheckJobPayload } from '@meridian/shared';

@Injectable()
export class InventoryQueueService {
  private readonly logger = new Logger(InventoryQueueService.name);

  async enqueueLowStockCheck(payload: LowStockCheckJobPayload): Promise<void> {
    await Promise.resolve();
    // BullMQ stub — enqueue inventory.low-stock-check in production
    this.logger.log(`low-stock-check job: ${JSON.stringify(payload)}`);
  }
}
