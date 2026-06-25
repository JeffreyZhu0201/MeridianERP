import { Module } from '@nestjs/common';
import { PaymentModule } from '../../payment/payment.module';
import { PlatformSettingsController } from './platform-settings.controller';
import { PlatformSettingsService } from './platform-settings.service';

@Module({
  imports: [PaymentModule],
  controllers: [PlatformSettingsController],
  providers: [PlatformSettingsService],
})
export class PlatformSettingsModule {}
