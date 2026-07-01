import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PlatformWithdrawalsController } from './platform-withdrawals.controller';
import { PlatformWithdrawalsService } from './platform-withdrawals.service';

/**
 * 平台提现模块
 *
 * 提供经销商提现申请审批功能。
 */
@Module({
  imports: [AuthModule],
  controllers: [PlatformWithdrawalsController],
  providers: [PlatformWithdrawalsService],
  exports: [PlatformWithdrawalsService],
})
export class PlatformWithdrawalsModule {}
