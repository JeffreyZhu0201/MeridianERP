import { Module } from '@nestjs/common';
import { CommissionModule } from '../commission/commission.module';
import { InventoryModule } from '../inventory/inventory.module';
import { FulfillmentService } from './fulfillment.service';

@Module({
  imports: [InventoryModule, CommissionModule],
  providers: [FulfillmentService],
  exports: [FulfillmentService],
})
export class FulfillmentModule {}
