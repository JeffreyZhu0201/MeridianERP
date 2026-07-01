import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PlatformFundsController } from './platform-funds.controller';
import { MerchantFundsService, PlatformFundsService } from './platform-funds.service';

/**
 * 平台资金模块
 *
 * 提供平台资金管理和商户资金汇总功能。
 *
 * 导出的服务：
 * - PlatformFundsService：平台资金服务
 * - MerchantFundsService：商户资金服务（供其他模块使用）
 */
@Module({
  imports: [AuthModule],
  controllers: [PlatformFundsController],
  providers: [PlatformFundsService, MerchantFundsService],
  exports: [PlatformFundsService, MerchantFundsService],
})
export class PlatformFundsModule {}
