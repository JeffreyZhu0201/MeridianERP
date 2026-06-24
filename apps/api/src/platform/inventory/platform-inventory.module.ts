import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { PlatformInventoryController } from './platform-inventory.controller';
import { PlatformInventoryService } from './platform-inventory.service';

@Module({
  imports: [AuthModule, InventoryModule],
  controllers: [PlatformInventoryController],
  providers: [PlatformInventoryService],
})
export class PlatformInventoryModule {}
