import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { PlatformInventoryController } from './platform-inventory.controller';
import { PlatformInventoryService } from './platform-inventory.service';

/**
 * 平台库存模块
 *
 * 提供跨租户的库存查看功能，供平台管理员使用。
 */
@Module({
  imports: [AuthModule, InventoryModule],
  controllers: [PlatformInventoryController],
  providers: [PlatformInventoryService],
})
export class PlatformInventoryModule {}
