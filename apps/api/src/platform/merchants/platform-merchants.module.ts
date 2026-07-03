import { Module } from '@nestjs/common';
import { PlatformMerchantsController } from './platform-merchants.controller';
import { PlatformMerchantsService } from './platform-merchants.service';
import { AuthModule } from '../../auth/auth.module';
import { QueueModule } from '../../queue/queue.module';
import { PlatformAccountsModule } from '../accounts/platform-accounts.module';

@Module({
  imports: [AuthModule, QueueModule, PlatformAccountsModule],
  controllers: [PlatformMerchantsController],
  providers: [PlatformMerchantsService],
})
export class PlatformMerchantsModule {}
