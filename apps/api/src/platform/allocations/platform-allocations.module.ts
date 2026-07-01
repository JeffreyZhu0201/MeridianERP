import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { PlatformAllocationsController } from './platform-allocations.controller';
import { PlatformAllocationsService } from './platform-allocations.service';

/**
 * 平台配额分配模块
 *
 * 提供主SKU管理和配额分配功能。
 */
@Module({
  imports: [AuthModule, InventoryModule],
  controllers: [PlatformAllocationsController],
  providers: [PlatformAllocationsService],
  exports: [PlatformAllocationsService],
})
export class PlatformAllocationsModule {}
