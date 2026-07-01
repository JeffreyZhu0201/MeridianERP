import { Module } from '@nestjs/common';
import { PlatformMerchantsController } from './platform-merchants.controller';
import { PlatformMerchantsService } from './platform-merchants.service';
import { AuthModule } from '../../auth/auth.module';
import { QueueModule } from '../../queue/queue.module';

/**
 * 平台商户模块
 *
 * 提供商户审批和管理功能，包括入驻审核、经销商分配等。
 */
@Module({
  imports: [AuthModule, QueueModule],
  controllers: [PlatformMerchantsController],
  providers: [PlatformMerchantsService],
})
export class PlatformMerchantsModule {}
