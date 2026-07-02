import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PlatformAllocationsModule } from '../allocations/platform-allocations.module';
import { PlatformReplenishmentController } from './platform-replenishment.controller';
import { PlatformReplenishmentService } from './platform-replenishment.service';

@Module({
  imports: [AuthModule, PlatformAllocationsModule],
  controllers: [PlatformReplenishmentController],
  providers: [PlatformReplenishmentService],
  exports: [PlatformReplenishmentService],
})
export class PlatformReplenishmentModule {}
