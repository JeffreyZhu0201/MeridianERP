import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CommissionModule } from '../../commission/commission.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { PlatformAllocationsController } from './platform-allocations.controller';
import { PlatformAllocationsService } from './platform-allocations.service';

@Module({
  imports: [AuthModule, InventoryModule, CommissionModule],
  controllers: [PlatformAllocationsController],
  providers: [PlatformAllocationsService],
  exports: [PlatformAllocationsService],
})
export class PlatformAllocationsModule {}
