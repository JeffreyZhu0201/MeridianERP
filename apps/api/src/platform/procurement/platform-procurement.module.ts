import { Module } from '@nestjs/common';
import { PlatformAllocationsModule } from '../allocations/platform-allocations.module';
import { PlatformProcurementController } from './platform-procurement.controller';
import { PlatformProcurementService } from './platform-procurement.service';

@Module({
  imports: [PlatformAllocationsModule],
  controllers: [PlatformProcurementController],
  providers: [PlatformProcurementService],
})
export class PlatformProcurementModule {}
