import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PlatformAllocationsModule } from '../allocations/platform-allocations.module';
import { PlatformReplenishmentController } from './platform-replenishment.controller';
import { PlatformReplenishmentService } from './platform-replenishment.service';

/**
 * 平台补货模块
 *
 * 提供商户补货请求审批功能。
 */
@Module({
  imports: [AuthModule, PlatformAllocationsModule],
  controllers: [PlatformReplenishmentController],
  providers: [PlatformReplenishmentService],
  exports: [PlatformReplenishmentService],
})
export class PlatformReplenishmentModule {}
