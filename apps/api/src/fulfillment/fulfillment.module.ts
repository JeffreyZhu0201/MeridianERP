import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { FulfillmentService } from './fulfillment.service';

@Module({
  imports: [InventoryModule],
  providers: [FulfillmentService],
  exports: [FulfillmentService],
})
export class FulfillmentModule {}
