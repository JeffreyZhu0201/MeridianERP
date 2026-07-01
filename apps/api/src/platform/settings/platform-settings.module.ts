import { Module } from '@nestjs/common';
import { PaymentModule } from '../../payment/payment.module';
import { PlatformSettingsController } from './platform-settings.controller';
import { PlatformSettingsService } from './platform-settings.service';

/**
 * 平台设置模块
 *
 * 提供平台全局配置管理功能。
 */
@Module({
  imports: [PaymentModule],
  controllers: [PlatformSettingsController],
  providers: [PlatformSettingsService],
})
export class PlatformSettingsModule {}
